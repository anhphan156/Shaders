
#extension GL_OES_standard_derivatives : enable
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

vec2 wedge(vec2 uv){
    float tri1 = ceil(uv.x - uv.y);
    float tri2 = ceil((1.0 - uv.x) - uv.y);

    return vec2(tri2 - tri1, tri1 - tri2);
}

float sdBox( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;

    vec2 w_h = wedge(uv);
    vec2 w_v = wedge(uv.yx);

    float right = min(w_h.y, 1.0 - uv.y);
    float top = min(w_v.y, uv.x);
    float left = min(w_h.x, uv.y);
    float bot = min(w_v.x, 1.0 - uv.x);

    float gradient = fract(max(right, max(top, max(left, bot))) - fract(u_time * .2));

    float box = smoothstep(0.0, 0.01, sdBox(uv - .5, vec2(.45)));

    vec3 col = vec3(box * gradient);

    gl_FragColor = vec4(col, 1.0);
}