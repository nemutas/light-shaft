#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vPosition;
in float vDepth;

layout(location = 0) out vec4 gColor;
layout(location = 1) out vec4 gNormalDepth;
layout(location = 2) out vec4 gPosition;

void main() {
  // gColor = vec4(vNormal.rrr * 0.5 + 0.5, 1.0);
  gColor = vec4(vec3(vDepth), 1.0);
  gNormalDepth = vec4(vNormal, vDepth);
  gPosition = vec4(vPosition, 0.0);
}