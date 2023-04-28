#extension GL_OES_standard_derivatives : enable
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_texture_0;

mat2 rotate(float a);

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution;
    uv.x *= u_resolution.x / u_resolution.y;

    vec3 tex = texture2D(u_texture_0, gl_FragCoord.xy / u_resolution).xyz;

    vec3 col = vec3(uv, 1.0);
    
    vec2 left_jaw_uv = uv - .5;
    left_jaw_uv.y += .025;
    left_jaw_uv *= rotate(2.5);
    float left_jaw = left_jaw_uv.x + .17 - pow(left_jaw_uv.y + .19, 2.);

    vec2 right_jaw_uv = uv - .5;
    float right_jaw = right_jaw_uv.x -.9 + pow(right_jaw_uv.y - .5, 2.) * .5;

    float d = min(left_jaw, -right_jaw);

    col = vec3(smoothstep(fwidth(d), .005, d));

    col = mix(col, tex, .3);

    gl_FragColor = vec4(col, 1.0);
}

mat2 rotate(float a){
    float c = sin(a);
    float s = cos(a);

    return mat2(c, -s, s, c);
}