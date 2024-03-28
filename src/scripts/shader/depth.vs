#version 300 es

in vec3 position;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

out float vDepth;

void main() {
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  vDepth = (gl_Position.z / gl_Position.w) * 0.5 + 0.5;
}