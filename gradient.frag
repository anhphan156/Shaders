#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

#define tau 6.28

float plot(float y, float pct){
    return smoothstep(pct - .005, pct, y) - smoothstep(pct, pct + .005, y);
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv -= .5;
    uv *= 2.;
    // uv.x *= u_resolution.x / u_resolution.y; 

    // uv = uv.x * vec2(-1., 0.) + uv.y * vec2(0., 1.);

    vec3 red = vec3(.3, .3, 0.2);
    vec3 green = vec3(0.7, 0.5, 0.6);

    vec3 pct = vec3(uv.x);
    pct.r = pow(smoothstep(0., 1., uv.x +.4), 5.) - .3;
    pct.g = sin(uv.x * 1. * tau - 1.5) * .9;
    pct.b = smoothstep(1., 0., uv.x - .1);
    pct.b = pow(pct.b, 4.) - .2;

    vec3 col = mix(red, green, pct);

    col = mix(col, vec3(1., 0., 0.), plot(uv.y, pct.r));
    col = mix(col, vec3(0., 1., 0.), plot(uv.y, pct.g));
    col = mix(col, vec3(0., 0., 1.), plot(uv.y, pct.b));
    col = mix(col, vec3(1.), plot(uv.y, 0.));
    col = mix(col, vec3(1.), plot(uv.x, 0.));
    col = mix(col, vec3(1., .5, .5), plot(uv.y, uv.x));


    gl_FragColor = vec4(col, 1.);
}