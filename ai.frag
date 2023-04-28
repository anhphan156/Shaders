#extension GL_OES_standard_derivatives : enable
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_texture_0;

mat2 rotate(float a);
float smin( float a, float b, float k );

float face(vec2 uv);
float left_hair(vec2 uv);
float left_stripe(vec2 uv);
float right_hair(vec2 uv);

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution;
    uv.x *= u_resolution.x * 1.0 / u_resolution.y;

    vec3 tex = texture2D(u_texture_0, gl_FragCoord.xy / u_resolution).xyz;

    vec3 col = vec3(0.);

    float right_hair_d = right_hair(uv);
    col = mix(col, vec3(0.7843, 0.2235, 0.8588), smoothstep(.0, .01, right_hair_d));
    
    float face_d = face(uv);
    col = mix(col, vec3(1.), smoothstep(fwidth(face_d), .005, face_d));

    float left_hair_d = left_hair(uv);
    vec3 left_hair_color = mix(vec3(0.9412, 0.2471, 0.7098), vec3(0.), uv.x - .4*uv.y + .8);
    col = mix(col, left_hair_color, smoothstep(.0, .01, left_hair_d));

    float left_hair_inner_shade_d = left_hair(uv - vec2(0.007, .0)) - .01;
    col = mix(col, vec3(0.6275, 0.3294, 0.9686), smoothstep(.0, .01, left_hair_inner_shade_d));

    float left_stripe_d = left_stripe(uv);
    col = mix(col, vec3(0.6275, 0.1725, 0.9333), smoothstep(fwidth(left_stripe_d), .005, left_stripe_d));

    col = pow(col, vec3(.4545));
    // col = mix(col, tex, .3);

    gl_FragColor = vec4(col, 1.0);
}

float left_stripe(vec2 uv){
    vec2 left_uv = uv - .5;
    left_uv -= vec2(0.085, .75);
    left_uv *= rotate(0.83);
    float d1 = left_uv.x - pow(left_uv.y, 2.) * .8;
    
    vec2 right_uv = uv - .5;
    right_uv -= vec2(0.21, .80);
    right_uv *= rotate(0.83);
    float d2 = right_uv.x - pow(right_uv.y, 2.) * .8;

    return min(d1, -d2);
}

float right_hair(vec2 uv){
    vec2 left_uv = uv - .5;
    float d2 = left_uv.x - .359;

    vec2 right_uv = uv - .5;
    right_uv -= vec2(0.61, 0.1);
    float d1 = right_uv.x + pow(right_uv.y, 2.) * .8;

    return min(-d1, d2);
}

float left_hair(vec2 uv){
    vec2 left_hair_uv = uv - .5;
    left_hair_uv -= vec2(-0.32, 0.00);
    left_hair_uv *= rotate(1.69);
    float d1 = left_hair_uv.x - pow(left_hair_uv.y, 3.);

    vec2 left_bang_uv = uv - .5;
    left_bang_uv -= vec2(0.12, 0.05);
    left_bang_uv *= rotate(1.3);
    float d2 = left_bang_uv.x + pow(left_bang_uv.y, 2.) * .5;

    return min(d1, -d2);
}

float face(vec2 uv){
    vec2 left_jaw_uv = uv - .5;
    left_jaw_uv.y += .025;
    left_jaw_uv *= rotate(2.5);
    float left_jaw = left_jaw_uv.x + .17 - pow(left_jaw_uv.y + .19, 2.);

    vec2 right_jaw_uv = uv - .5;
    right_jaw_uv *= rotate(1.1);
    float right_jaw = right_jaw_uv.x - 0.52 + pow(right_jaw_uv.y + .03, 2.) * 0.9;

    float d = smin(left_jaw, -right_jaw, .01);
    d = smin(d, length(uv - vec2(1.4, 0.562)) - .4, .05); // carve out forehead

    return d;
}

mat2 rotate(float a){
    float c = sin(a);
    float s = cos(a);

    return mat2(c, -s, s, c);
}

float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}