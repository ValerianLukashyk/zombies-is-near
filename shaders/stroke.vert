// stroke.vert
varying vec3 vNormal;
varying vec3 vPos;
varying vec4 vModelViewMatrix;

void main() {
    vec3 vNormal = normal;
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
