#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

#define MAX_STEPS 75
#define MAX_DIST 120.
#define SURF_DIST 0.01

mat3 rotate(float angle){
    float c = cos(angle);
    float s = sin(angle);

    return mat3(
        c, 0., s,
        0., 1., 0.,
        -s, 0., c
    );
}

float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float lineSDF( vec3 p, vec3 a, vec3 b )
{
    vec3 pa = p - a;
    vec3 ba = b - a;

    float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);

    return length(pa - ba * t);
}

float helixSDF(vec3 q)
{   
    float l = length(q.xz) - 8.0;
    float d = mod(atan(q.z,q.x)-(q.y * 0.2 ), 6.28) - 3.14;
    return length(vec2(l, d)) - 0.35;
}

float sceneSDF(vec3 p){
    p -= vec3(0.0, 0.0, -50.0);
    p = rotate(u_time) * p;
    float helix1 = helixSDF(p);
    float helix2 = helixSDF(p - vec3(0.0, 16.0, 0.0));

    float scene = min(helix1, helix2);

    for(float i = 0.0; i < 11.0; i += 1.0){
        float line_length = 7.5;
        float line_speed = 5.00;
        float line_spacing = i * 1.5;
        float line_rotation_phase = -i/3.5;
        float line_animation = u_time * line_speed;
        vec3 line_uv = vec3(p.x, mod(p.y - 0., 15.88), p.z);
        float line = lineSDF(line_uv, 
            vec3(-line_length * cos(line_rotation_phase), line_spacing, line_length * sin(line_rotation_phase)), 
            vec3(line_length * cos(line_rotation_phase), line_spacing, -line_length * sin(line_rotation_phase))
        ) - .5;

        scene = smin(scene, line, .3);
    }

    return scene;
}

vec3 normal(vec3 p){
    vec2 e = vec2(.001, 0.0);

    return normalize(vec3(
        sceneSDF(p + e.xyy) - sceneSDF(p - e.xyy),
        sceneSDF(p + e.yxy) - sceneSDF(p - e.yxy),
        sceneSDF(p + e.yyx) - sceneSDF(p - e.yyx)
    )); 
}

float rayMarch(vec3 ro, vec3 rd){
    float dO = 0.;

    for(int i = 0; i < MAX_STEPS; i++){
        vec3 p = ro + rd * dO;

        float d = sceneSDF(p);
        dO += d;

        if(d < SURF_DIST || dO > MAX_DIST) break;
    }

    return dO;
}

float lighting(vec3 p, vec3 lightPos){

    vec3 lightVec = lightPos - p;
    vec3 surfNormal = normal(p);

    float shading = clamp(dot(lightVec, surfNormal), 0., 1.);

    // distance from point to light
    float dL = rayMarch(p + surfNormal * SURF_DIST * 2.00, lightVec);
    if(dL < distance(p + surfNormal * SURF_DIST * 2.00, lightPos)) shading *= 0.1;

    return shading;
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv -= .5;
    uv.x *= u_resolution.x / u_resolution.y;

    vec3 ro = vec3(0., 0., 30.);
    vec3 rd = normalize(vec3(uv.x, uv.y, -1.));

    //ray march
    float dO = rayMarch(ro, rd);
    vec3 p = (ro + rd * dO);

    vec3 light_pos = ro;

    float shading = lighting(p, light_pos) - .3;

    vec3 col = mix(vec3(0.1333, 0.2314, 0.2157), vec3(0.7216, 0.6627, 0.4627), shading);
    col = normal(p);

    gl_FragColor = vec4(col, 1.);
}