
#extension GL_OES_standard_derivatives : enable
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

#define COUNT 628.

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;
    uv -= .5;
    uv *= 5.0;

    vec2 c = vec2(0.0);
    float r = 1.5;
    float rp = .035;

    float a = 0.0;
    float d = 1.0;

    for(float i = 0.0; i < COUNT; i += 1.0){
        a += 6.28 / COUNT;
        vec2 p = vec2(cos(a), sin(a)) * r + c;
        vec2 pc = c - p;

        vec2 pos = p + pc * (sin(a * u_time) + 1.0);

        d = min(d, length(uv - pos) - rp);
    }

    vec3 col = vec3(smoothstep(0.0, -0.01, d));

    gl_FragColor = vec4(col, 1.0);
}