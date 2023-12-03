#extension GL_OES_standard_derivatives : enable
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

float sdStar5(in vec2 p, in float r, in float rf)
{
    const vec2 k1 = vec2(0.809016994375, -0.587785252292);
    const vec2 k2 = vec2(-k1.x,k1.y);
    p.x = abs(p.x);
    p -= 2.0*max(dot(k1,p),0.0)*k1;
    p -= 2.0*max(dot(k2,p),0.0)*k2;
    p.x = abs(p.x);
    p.y -= r;
    vec2 ba = rf*vec2(-k1.y,k1.x) - vec2(0,1);
    float h = clamp( dot(p,ba)/dot(ba,ba), 0.0, r );
    return length(p-ba*h) * sign(p.y*ba.x-p.x*ba.y);
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;
    uv -= .5;

    float d = sdStar5(uv, 2., .4);

    float wave = sin(d * 20. - u_time * 2.0) * .5 + .5;

    vec3 col = vec3(smoothstep(0.0, 0.01, wave));

    gl_FragColor = vec4(col, 1.0);
}