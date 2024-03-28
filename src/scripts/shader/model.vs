#version 300 es

in vec3 position;
in vec3 normal;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat3 normalMatrix;

out vec3 vNormal;
out vec3 vPosition;
out float vDepth;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = vec4(modelMatrix * vec4(position, 1.0)).xyz;
  
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);

  vDepth = (gl_Position.z / gl_Position.w) * 0.5 + 0.5;
}