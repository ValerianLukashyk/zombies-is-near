precision highp float;
// #define GLSLIFY 1
uniform sampler2D uTexture;
uniform float time;
uniform vec3 color;
uniform vec3 cameraPos;
uniform vec2 resolution;

varying vec2 vTexCoord;
varying vec3 vNormal;
// varying vec3 vPos;
// varying vec4 vModelViewMatrix;

void main() {
    vec4 texel = texture2D(uTexture, vTexCoord);
    gl_FragColor = texel;
}