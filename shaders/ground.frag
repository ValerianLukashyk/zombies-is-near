uniform float uTime;
uniform vec2 uFrequency;
uniform vec2 uAmplitude;
uniform vec3 uColor1;
uniform vec3 uColor2;
varying vec2 vUv;

float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise (vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm (vec2 st) {
    float value = 0.0;
    float amplitude = uAmplitude.x;
    vec2 frequency = uFrequency;
    
    for (int i = 0; i < 6; i++) {
        value += amplitude * noise(st * frequency);
        frequency *= 2.0;
        amplitude *= uAmplitude.y;
    }
    
    return value;
}

void main() {
    vec2 st = vUv * 200.0;
    float noiseValue = fbm(st);
    
    vec3 color1 = vec3(uColor1);
    vec3 color2 = vec3(uColor2);
    vec3 color = mix(color1, color2, noiseValue);
    
    gl_FragColor = vec4(color, 1.0);
}
