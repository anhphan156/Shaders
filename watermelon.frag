#extension GL_OES_standard_derivatives : enable
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float line_sdf(vec2 p, vec2 a, vec2 b){
    vec2 ab = b - a;
    vec2 ap = p - a;

    float t = clamp(dot(ap, ab) / dot(ab,ab), 0.0, 1.0);
    return length(ap - ab*t);
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution;
    uv.x *= u_resolution.x / u_resolution.y;

    vec3 col = vec3(0.5569, 0.6235, 1.0);

    vec3 wm_col = mix(vec3(0.6588, 1.0, 0.6863), vec3(0.9608, 1.0, 0.5922), smoothstep(.14, .13, length((uv - vec2(.5, .55)) / vec2(1.7, 1.0)) - .08));
    wm_col = mix(wm_col, vec3(1.0, 0.8588, 0.4784), smoothstep(.14, .13, length((uv - vec2(.5, .55)) / vec2(1.7, 1.0)) - .05));
    wm_col = mix(wm_col, vec3(1.0, 0.3216, 0.0549), smoothstep(.14, .13, length((uv - vec2(.5, .55)) / vec2(1.7, 1.0)) - .02));

    vec2 wuv = uv -.5;
    float wm_d = length(wuv / vec2(1.7, 1.0));
    float cut_off = smin(dot(wuv + vec2(.0, .1), vec2(.707, -.707)), dot(wuv + vec2(.0, .1), vec2(-.707, -.707)), .03);
    wm_d = smin(wm_d, -cut_off, -.03);
    col = mix(col, wm_col, smoothstep(.202, .2, wm_d));

    col = mix(col, vec3(0.2, 0.051, 0.051), smoothstep(.023, .015, length((vec2(abs(uv.x - .5), uv.y)) - vec2(.06, .53))));

    col = mix(col, vec3(.2, .051, .051), smoothstep(.04, .032, smin(dot(uv - .465, vec2(0.0, 1.0)), length(uv -.5), -.01)));

    col = mix(col, vec3(2.), smoothstep(.01, .003, line_sdf(uv - .5, vec2(.082, 0.07), vec2(.045, .11))));
    col = mix(col, vec3(2.), smoothstep(.01, .003, line_sdf(uv - .5, vec2(.107, 0.043), vec2(.10, .05))));

    col = mix(col, vec3(1.0, 0.4745, 0.1725), smoothstep(.013, .005, length(uv - vec2(.56, .42))));
    col = mix(col, vec3(1.0, 0.4745, 0.1725), smoothstep(.013, .005, length(uv - vec2(.42, .44))));
    col = mix(col, vec3(1.0, 0.4745, 0.1725), smoothstep(.013, .005, length(uv - vec2(.52, .57))));
    col = mix(col, vec3(1.0, 0.4745, 0.1725), smoothstep(.013, .005, length(uv - vec2(.35, .50))));
    col = mix(col, vec3(1.0, 0.4745, 0.1725), smoothstep(.013, .005, length(uv - vec2(.65, .49))));

    gl_FragColor = vec4(col, 1.0);
}