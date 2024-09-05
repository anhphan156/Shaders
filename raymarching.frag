#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform samplerCube u_cubeMap;
uniform vec2 u_mouse;

// === Object
#define M_BALL 5.0
#define M_CUBE 6.0
#define M_TOP 7.0

#define MAX_STEPS 128
#define MAX_DIST 8.
#define SURF_DIST .01

float smin( float a, float b, float k );
mat2 rotate(float angle);
float cubeSDF(vec3 p, vec3 r);
float sdOctahedron( vec3 p, float s);
float sphereSDF(vec3 p, vec4 sphere);
vec2 sceneSDF(vec3 p);

vec3 normal(vec3 p);
vec2 rayMarch(vec3 ro, vec3 rd);
float lighting(vec3 p, vec3 lightPos);

vec3 render(inout vec3 ro, inout vec3 rd, inout vec3 ref, bool last_trace);

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv -= .5;
    uv.x *= u_resolution.x / u_resolution.y;
    vec2 m = u_mouse.xy / u_resolution.xy;

    vec3 ro = vec3(0.0, 0.0, 3.0);
    vec3 rd = normalize(vec3(uv, -0.5));
    // ro.xz = rotate(-m.x * 6.28) * ro.xz;
    // ro.zy = rotate(-m.y * 3.14 + 1.) * ro.zy;

    vec3 col = vec3(0.0);
    //ray march
    vec3 ref = vec3(1.0);
    vec3 fil = vec3(1.0);

    const float NUM_BOUNCES = 2.0;
    for(float i = 0.0; i < NUM_BOUNCES; i += 1.0){
        col += render(ro, rd, ref, i == NUM_BOUNCES - 1) * fil;

        fil *= ref;
    }


    gl_FragColor = vec4(pow(col, vec3(.4545)), 1.);
}

vec3 render(inout vec3 ro, inout vec3 rd, inout vec3 ref, bool last_trace){
    vec3 sky = texture(u_cubeMap, rd).xyz;
    vec3 col = sky;
    vec2 scene = rayMarch(ro, rd);

    ref *= 0.0;

    if(scene.x < MAX_DIST){
        vec3 p = ro + rd * scene.x;
        vec3 surfNormal = normal(p);

        float shading = dot(normalize(vec3(1.0, 0.0, 3.0) - p), surfNormal) * .5 + .5;

        col = vec3(0.0);

        if(scene.y == M_BALL){
            col += shading * 0.15;
            ref = vec3(.9);
        }else if(scene.y == M_CUBE){
            col += shading * vec3(0.2118, 0.4745, 0.6863);
            ref = vec3(.1);
        }else if(scene.y == M_TOP){
            col += shading * vec3(.03294, .3667, .03098);
            ref = vec3(.4);
        }

        if(last_trace) col += sky * ref;

        ro = p + surfNormal * SURF_DIST * 3.0;
        rd = reflect(rd, surfNormal);
    }

    return col;
}

float cubeSDF(vec3 p, vec3 r){
    vec3 q = abs(p) - r;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sphereSDF(vec3 p, vec4 sphere){
    return distance(p, sphere.xyz) - sphere.w;
}

vec2 sceneSDF(vec3 p){
    float ball1 = length(p - vec3(sin(u_time) * 2., 0.0, cos(u_time) * 2.)) - .5;

    vec3 cube_p = p;
    // cube_p.xz = rotate(3.14 / -4.) * cube_p.xz;
    cube_p.y += 1.9;
    // float cube1 = cubeSDF(cube_p, vec3(5.5, 0.5, 1.5)) - .05;
    float cube1 = length(p) - 0.8;
    // float ball2 = sphereSDF(p + vec3(0., 0., 0.), vec4(1.5, .5, -4.5, 0.5));

    // float dickhead = sphereSDF(p + vec3(0., mix(0.0, -1.7, clamp(u_time, 0., 1.)), 0.), vec4(1.0, 1.5, -4.65, 0.35));
    // float cube = cubeSDF(p + vec3(-1., -.9, 4.5), vec3(.3, -cos(u_time) / 2. + 1., 0.1));
    // float cube = cubeSDF(p + vec3(-1., mix(-.9, -1.7, clamp(u_time, 0., 1.)), 4.5), vec3(.3, mix(.5, 1.3, clamp(u_time, 0., 1.)), 0.1));

    // float dickhead = sphereSDF(p + vec3(0., mix(0.0, -1.7, (sin(u_time) + 1.) / 2.), 0.), vec4(1.0, 1.5, -4.65, 0.39));
    // float dickbody = cubeSDF(p + vec3(-1., mix(-.9, -1.7, (sin(u_time) + 1.) / 2.), 4.5), vec3(.3, mix(.5, 1.3, (sin(u_time) + 1.) / 2.), 0.1));
    // scene = min(scene, dickbody);
    // scene = min(scene, dickhead);

    p.xz *= rotate(u_time);
    float top = sdOctahedron(p - vec3(0.0, 1.9, 0.0), .5);

    vec2 scene = vec2(0.0);
    // scene.x = smin(ball1, cube1, .3);
    scene.x = min(ball1, cube1);
    scene.x = min(scene.x, top);

    if(scene.x == ball1){
        scene.y = M_BALL;
    }else if(scene.x == cube1){
        scene.y = M_CUBE;
    }else if(scene.x == top){
        scene.y = M_TOP;
    }

    return scene;
    // return min(scene, dot(p, vec3(0.0, 1.0, 0.0)));
}

vec3 normal(vec3 p){
    vec2 e = vec2(.0001, 0.0);

    return normalize(vec3(
        sceneSDF(p + e.xyy).x - sceneSDF(p - e.xyy).x,
        sceneSDF(p + e.yxy).x - sceneSDF(p - e.yxy).x,
        sceneSDF(p + e.yyx).x - sceneSDF(p - e.yyx).x
    )); 
}

vec2 rayMarch(vec3 ro, vec3 rd){
    float dO = 0.;
    vec2 scene = vec2(0.0);

    for(int i = 0; i < MAX_STEPS; i++){
        vec3 p = ro + rd * dO;

        scene = sceneSDF(p);
        float d = scene.x;
        dO += d;

        if(d < SURF_DIST || dO > MAX_DIST) break;
    }

    return vec2(dO, scene.y);
}

float lighting(vec3 p, vec3 lightPos){

    vec3 lightVec = normalize(lightPos - p);
    vec3 surfNormal = normal(p);

    float shading = dot(lightVec, surfNormal);

    // distance from point to light
    // float dL = rayMarch(p + surfNormal * SURF_DIST * 2.00, lightVec).x;
    // if(dL < distance(p + surfNormal * SURF_DIST * 2.00, lightPos)) shading *= 0.1;

    return clamp(shading, 0.0, 1.0);
}

mat2 rotate(float angle){
    float s = sin(angle);
    float c = cos(angle);

    return mat2(c, -s, s, c);
}

float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float sdOctahedron( vec3 p, float s)
{
  p = abs(p);
  return (p.x+p.y+p.z-s)*0.57735027;
}
