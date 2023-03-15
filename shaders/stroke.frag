// stroke.frag
uniform float time;
uniform vec3 color;
uniform vec3 cameraPosition;

varying vec3 vNormal;
varying vec3 vPos;
varying vec4 vModelViewMatrix;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 worldPosition = (vModelViewMatrix * vec4(vPos, 1.0)).xyz;
    vec3 cameraToVertex = normalize(worldPosition - cameraPosition);

    float rim = 1.0 - dot(normal, cameraToVertex);
    rim = pow(abs(rim), 2.0) * 2.0;

    gl_FragColor = vec4(mix(color, vec3(1.0), rim), 1.0);
}
