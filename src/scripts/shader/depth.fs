#version 300 es
precision highp float;

in float vDepth;
out vec4 outColor;

#include './modules/packing.glsl'

void main() {
  outColor = packDepthToRGBA(vDepth);
}