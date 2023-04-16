#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;

#define N_SPHERES 3
#define MAX_FLOAT 99999.

struct Ray {
    vec3 ro;
    vec3 rd;
};

struct Material {
    vec3 albedo;
};

struct Sphere {
    vec3 position;
    float radius;
    Material material;
};

struct Scene {
    Sphere spheres[N_SPHERES];
    Material materials[N_SPHERES];
};

struct HitPayload{
    Sphere hit_sphere;
    float hit_distance;
    vec3 world_position;
    vec3 world_normal;
};

void SceneInit();
HitPayload ray_trace(Ray ray);
HitPayload miss();
HitPayload closest_hit(Ray ray, float hit_distance, Sphere hit_sphere);

Scene scene;

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;
    uv *= 2.;
    uv -= 1.;

    Ray ray;
    ray.ro = vec3(0., 0., 3.);
    ray.rd = normalize(vec3(uv, 0.) - ray.ro);

    SceneInit();

    vec3 light_pos = vec3(.5, 4.5, 1.);
    vec3 col = vec3(0.);

    float multiplier = .8;

    for (int i = 0; i < 2; i++){
        HitPayload hp = ray_trace(ray);
        if(hp.hit_distance < 0.) {
            // nohit
            col += vec3(0.2902, 0.7333, 0.9922) * multiplier;
            break;
        }else{
            vec3 light_dir = normalize(light_pos - hp.world_position);

            Ray shadow_test_ray;
            shadow_test_ray.ro = hp.world_position + hp.world_normal * .0001;
            shadow_test_ray.rd = light_dir;
            HitPayload shadow_test = ray_trace(shadow_test_ray);
            float light_intensity = 0.;
            if(shadow_test.hit_distance < 0.) light_intensity = dot(light_dir, hp.world_normal);

            vec3 sphereCol = hp.hit_sphere.material.albedo * light_intensity * 1.5 * vec3(0.7137, 0.4392, 0.7137);
            col += sphereCol * multiplier;
            multiplier *= .4;

            ray.ro = hp.world_position + hp.world_normal * .0001;
            ray.rd = reflect(ray.rd, hp.world_normal);
        }
    }


    gl_FragColor = vec4(col, 1.);
}

HitPayload ray_trace(Ray ray){
    float hit_distance = MAX_FLOAT;
    Sphere hit_sphere;
    for(int i = 0; i < N_SPHERES; i++){
        vec3 sphere = scene.spheres[i].position;
        float radius = scene.spheres[i].radius;

        float a = 1.; // dot(rd, rd)
        float half_b = dot(ray.rd, ray.ro - sphere);
        float c = dot(ray.ro - sphere, ray.ro - sphere) - pow(radius, 2.);

        float disc = pow(half_b, 2.) - a * c;
        if(disc < 0.) continue;

        float t = -(half_b + sqrt(disc)) / a;

        if (t > 0. && t < hit_distance) {
            hit_distance = t;
            hit_sphere = scene.spheres[i];
        }
    }

    if(hit_distance == MAX_FLOAT) return miss();

    return closest_hit(ray, hit_distance, hit_sphere);
}

HitPayload miss(){
    HitPayload hp;
    hp.hit_distance = -1.;

    return hp;
}

HitPayload closest_hit(Ray ray, float hit_distance, Sphere hit_sphere){
    HitPayload hp;
    hp.hit_sphere = hit_sphere;
    hp.hit_distance = hit_distance;
    hp.world_position = ray.ro + hp.hit_distance * ray.rd;
    hp.world_normal = normalize(hp.world_position - hit_sphere.position);
    return hp;
}

void SceneInit(){
    scene.materials[0].albedo = vec3(0.9608, 0.4314, 0.4314);
    scene.materials[1].albedo = vec3(0.7529, 0.3765, 0.9255);
    scene.materials[2].albedo = vec3(0.3725, 0.8941, 0.3725);

    scene.spheres[0].position = vec3(-0.37, .6, sin(u_time));
    scene.spheres[0].radius = .5;
    scene.spheres[0].material = scene.materials[0];
    scene.spheres[1].position = vec3(0.3, -.42, -.0);
    scene.spheres[1].radius = .5;
    scene.spheres[1].material = scene.materials[1];
    scene.spheres[2].position = vec3(-0.7, -.42, -.0);
    scene.spheres[2].radius = .3;
    scene.spheres[2].material = scene.materials[2];
}