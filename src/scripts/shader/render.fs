#version 300 es
precision highp float;

struct Camera {
  vec3 position;
  mat4 projectionMatrixInverse;
  mat4 viewMatrixInverse;
};
struct Light {
  sampler2D depthMap;
  vec3 position;
  mat4 projectionMatrix;
  mat4 viewMatrix;
};

uniform vec2 uResolution;
uniform sampler2D tDiffuse;
uniform sampler2D tNormalDepth;
uniform sampler2D tPosition;
uniform Light uLight;
uniform Camera uCamera;

in vec2 vUv;
out vec4 outColor;

#include './modules/packing.glsl'

float calcOcclusion(Light light, vec3 position, float bias) {
  vec4 lp = light.projectionMatrix * light.viewMatrix * vec4(position, 1.0);
  vec3 shadowCoord = lp.xyz / lp.w * 0.5 + 0.5;
  float depthPosFromLight = shadowCoord.z;
  float depthFromLight = unpackRGBAToDepth(texture(light.depthMap, shadowCoord.xy));
  float shadow = step(depthPosFromLight - bias, depthFromLight);
  return shadow;
}

vec3 hash(vec3 v) {
  uvec3 x = floatBitsToUint(v + vec3(0.1, 0.2, 0.3));
  x = (x >> 8 ^ x.yzx) * 0x456789ABu;
  x = (x >> 8 ^ x.yzx) * 0x6789AB45u;
  x = (x >> 8 ^ x.yzx) * 0x89AB4567u;
  return vec3(x) / vec3(-1u);
}

void main() {
  vec3 col;

  // ---
  vec4 positionMask = texture(tPosition, vUv);
  vec3 position = positionMask.xyz;
  float mask = 1.0 - positionMask.w;
  vec4 normalDepth = texture(tNormalDepth, vUv);
  vec3 normal = normalDepth.xyz;
  float depth = normalDepth.w;

  float dotNL = dot(normal, normalize(uLight.position));
  float bias = 0.005 * tan(acos(dotNL));
  bias = clamp(bias, 0.0, 0.01);
  float shadow = calcOcclusion(uLight, position, bias);

  shadow *= max(0.0, dotNL);
  shadow = shadow * (1.0 - 0.1) + 0.1;
  shadow *= mask;

  col += shadow;

  // ---
  vec2 suv = vUv * 2.0 - 1.0;
  vec3 ro = vec3(suv, -1.0); // 正規化デバイス座標系の始点は-1
  vec3 rd = normalize(vec3(0, 0, 1)); // +1方向にrayを飛ばす

  float i, samplingCount = 100.0; // サンプリングmax回数
  float accum = 0.0; // 蓄積値
  vec3 h = hash(ro) * 2.0 - 1.0;
  for (; i < samplingCount; i++) {
    // 正規化デバイス座標系のサンプリング点。+z方向にノイズを加えて少ないstep数でもいい感じに見えるようにぼかす
    vec3 ndcSamplingPosition = ro + rd * (2.0 * i / samplingCount) + vec3(0, 0, h.x) * 0.01;
    if (depth < ndcSamplingPosition.z * 0.5 + 0.5) break; // オブジェクトのdepth以上になってたら終了

    // ワールド座標系に変換する
    vec4 target = uCamera.viewMatrixInverse * uCamera.projectionMatrixInverse * vec4(ndcSamplingPosition, 1.0);
    vec3 worldSamplingPosition = target.xyz / target.w;
    // 遮蔽を計算する
    accum += calcOcclusion(uLight, worldSamplingPosition, 0.0);
  }
  float lightShaft = accum / samplingCount;
  lightShaft = 1.0 - (1.0 - lightShaft) * 2.0;
  // rayが物体に衝突している場合（物体表面）は、加算合成するため色を下げる
  // if (i / samplingCount < 1.0) {
  //   lightShaft *= 0.7;
  // }
  col += lightShaft;

  // 
  float n = 5.0, ninv = 1.0 / n;
  vec2 fuv = fract(vUv * n);
  if (vUv.x < ninv) {
    if (1.0 - vUv.y < ninv) {
      col = texture(tPosition, fuv).rgb;
    } else if (1.0 - vUv.y < ninv * 2.0) {
      col = vec3(1) * (1.0 - texture(tPosition, fuv).a);
    } else if (1.0 - vUv.y < ninv * 3.0) {
      col = texture(tNormalDepth, fuv).rgb;
    } else if (1.0 - vUv.y < ninv * 4.0) {
      col = vec3(1) * texture(tNormalDepth, fuv).a; 
    } else {
      fuv.x *= uResolution.x / uResolution.y;
      col = vec3(1) * unpackRGBAToDepth(texture(uLight.depthMap, fuv));
    }
    vec2 auv = abs(fuv * 2.0 - 1.0);
    float edge = step(auv.x, 0.99) * step(auv.y, 0.99);
    col *= edge;
  }

  outColor = vec4(vec3(col), 1.0);
}