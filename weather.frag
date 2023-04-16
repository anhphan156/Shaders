#extension GL_OES_standard_derivatives : enable
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

#define NUM_ClOUDS 5
#define NUM_STARS 15
#define PI 3.14159

vec3 background(vec2 uv);
float smin( float a, float b, float k);

float invLerp(float a, float b, float n);
float remap(float a, float b, float c, float d, float n);

mat2 rotate(float a);

float bounce(float x);

float circle_sdf(vec2 p, vec2 uv, float r);
float cloud_sdf(vec2 p, vec2 uv);
float star_sdf(vec2 p, float r, float rf);
float moon_sdf(vec2 p, float d, float ra, float rb);

float hash(vec2 v);
float hash2(vec2 v);

float day_length = 20.*PI/3.;
float day_time = mod(u_time, day_length);
float star_appear_time = 1.8; // divide day_length by this

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution;
    uv.x *= u_resolution.x / u_resolution.y;

    vec3 col = background(uv);

    // stars
    for(float i = 0.0; i < float(NUM_STARS); i += 1.0){
        vec2 hash_sample = vec2(hash2(vec2(i + 2.)), hash(vec2(i + 5.)));

        vec2 star_pos = hash_sample;
        star_pos.x = remap(-1.0, 1.0, -.5, .3, star_pos.x);
        star_pos.y = remap(-1., 1., .15, .4, star_pos.y);
        vec2 star_uv = rotate(hash_sample.x) * uv;
        star_uv -= .5;

        float drop_time_offset = remap(-1.0, 1.0, -.2, .3, hash_sample.x);

        float star_d = star_sdf(vec2(0.0,  16.*bounce(mod(u_time + drop_time_offset - day_length/star_appear_time, day_length))) - (star_uv - star_pos) * 10., .1, 2.5);
        col = mix(
            col,
            mix(col,
              mix(vec3(1.0, 0.9961, 0.7255), col, smoothstep(day_length*.75, day_length, day_time)), // to make star fade at dawn, start fading from 75% to 100% of the day
              step(day_length / star_appear_time, day_time - .3) // to make star appear at night, -3 is to time the dropping time and the appearing time
            ),
            smoothstep(.02, .01, star_d)
        );
    }

    // sun
    float sun_animation = u_time * -.3 + 3.2;
    vec2 sun_pos = vec2(cos(sun_animation) * 1.5, sin(sun_animation) * .7) * .5;
    vec2 sun_uv = uv - .5;
    float sun_d = circle_sdf(sun_pos, sun_uv, .13);
    float sun_ray_d = circle_sdf(sun_pos, sun_uv, .03);
    col = mix(col, mix(col, vec3(1.0, 0.9725, 0.7255), smoothstep(.5, .6, abs(uv.y))), smoothstep(.25, .02, sun_ray_d));
    col = mix(col, mix(col, vec3(1.0, 0.8706, 0.1451), smoothstep(.5, .6, abs(uv.y))), smoothstep(.01, .005, sun_d));

    // sun face
    vec2 face_uv = sun_uv - sun_pos;
    float eye_d = circle_sdf(vec2(.03, 0.035), vec2(abs(face_uv.x), face_uv.y), .005);
    float mouth_d = max(-circle_sdf(vec2(0.0), face_uv, .08), circle_sdf(vec2(0.0), face_uv, .07));

    float face_d = min(eye_d, max(dot(face_uv, vec2(0., 1)), mouth_d));
    col = mix(col, mix(col, vec3(0.), smoothstep(.3, .6, abs(uv.y))), smoothstep(.01, .005, face_d));

    // moon
    vec2 moon_uv = uv*-3.8 + vec2(2.9, 3.0);
    float moon_d = moon_sdf(moon_uv, .2, .5, .4);
    float moon_glow_d = moon_sdf(moon_uv, .2, .5, .4);

    col = mix(
        col,
        mix(col, 
        mix(vec3(0.9529, 0.8471, 0.6196), col, smoothstep(day_length * .90, day_length, day_time)), 
          smoothstep(day_length * .5, day_length / star_appear_time, day_time)
        ), 
        smoothstep(.8, .01, sqrt(moon_glow_d)));
    col = mix(
        col,
        mix(col, 
        mix(vec3(1.0, 0.9294, 0.6902), col, smoothstep(day_length * .80, day_length, day_time)), 
          smoothstep(day_length * .5, day_length / star_appear_time, day_time)
        ), 
        smoothstep(.03, .02, moon_d));

    // clouds
    for(int i = 0; i < NUM_ClOUDS; i++){
        vec2 hash_sample = vec2(hash(vec2(i)), hash(vec2(i)));

        vec2 cloud_pos = clamp(hash_sample, vec2(-.3, .0), vec2(.3, .3));
        float size = mix(3., 1., float(i) / float(NUM_ClOUDS));
        vec2 cloud_animation = vec2(u_time * .03 * size, 0.);

        vec2 cloud_uv = uv - cloud_animation;
        cloud_uv = mod(cloud_uv, 1.0);
        cloud_uv -= .5;
        
        float cloud_d = cloud_sdf(cloud_pos, cloud_uv * size);
        float cloud_shadow_d = cloud_sdf(cloud_pos - vec2(.01), cloud_uv * size);

        col = mix(col, vec3(0.0941, 0.0902, 0.0902), smoothstep(.15, .05, cloud_shadow_d + .11));
        col = mix(col, vec3(1.), smoothstep(.01, .005, cloud_d));
    }

    gl_FragColor = vec4(col, 1.0);
}

vec3 background(vec2 uv){
    vec3 col = vec3(0.);

    vec3 blue1 = vec3(0.2431, 0.8235, 1.0);
    vec3 blue2 = vec3(0.0471, 0.4902, 0.7137);

    vec3 darkblue1 = vec3(0.0, 0.1569, 0.4941);
    vec3 darkblue2 = vec3(0.0, 0.0471, 0.1451);

    vec3 darkyellow1 = vec3(1.0, 0.4941, 0.0235);
    vec3 darkyellow2 = vec3(0.7451, 0.3608, 0.0);

    vec3 morning = mix(vec3(1.0, 0.7961, 0.6039), vec3(1.0, 0.851, 0.6549), pow(uv.x * uv.y, .5));
    vec3 noon = mix(blue1, blue2, pow(uv.x * uv.y, .5));
    vec3 evening = mix(darkyellow2, darkyellow1, pow(uv.x * uv.y, .5));
    vec3 midnight = mix(darkblue2, darkblue1, pow(uv.x * uv.y, .5));

    if(day_time < day_length * .25){
        col = mix(morning, noon, smoothstep(0.0, day_length * .25, day_time));
    }else if(day_time < day_length * .5){
        col = mix(noon, evening, smoothstep(day_length * .25, day_length * .5, day_time));
    }else if(day_time < day_length * .75){
        col = mix(evening, midnight, smoothstep(day_length * .5, day_length * .75, day_time));
    }else{
        col = mix(midnight, morning, smoothstep(day_length * .75, day_length, day_time));
    }

    return col;
}

float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float bounce(float x){
    float r = 3.5;
    x = -log(1.-x) / log(r);

    x -= (1. - pow(r, -.5)) / (1. - 1./.5);
    float nth_bounce = floor(x);
    x = fract(x);

    float bounce = (1. - pow(r, -x)) / (1. - 1./r);

    bounce = -bounce * (bounce - 1.) / pow(r, nth_bounce * .8 + 1.);

    if(bounce < 1e-9) {
        return 0.0 ;
    }

    return bounce;
}

float circle_sdf(vec2 p, vec2 uv, float r){
    return length(p - uv) - r;
}

float cloud_sdf(vec2 p, vec2 uv){
    float c1 = circle_sdf(p, uv, .08);
    float c2 = circle_sdf(p - vec2(.1, .0), uv, .055);
    float c3 = circle_sdf(p + vec2(.1, .0), uv, .055);

    float smin_constant = .015;
    return smin(c1, smin(c2, c3, smin_constant), smin_constant);
}

float star_sdf(vec2 p, float r, float rf){
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

float moon_sdf(vec2 p, float d, float ra, float rb){
    p.y = abs(p.y);
    float a = (ra*ra - rb*rb + d*d)/(2.0*d);
    float b = sqrt(max(ra*ra-a*a,0.0));
    if( d*(p.x*b-p.y*a) > d*d*max(b-p.y,0.0) )
          return length(p-vec2(a,b));
    return max( (length(p          )-ra),
               -(length(p-vec2(d,0))-rb));
}

float hash(vec2 v){
    return sin(dot(v, vec2(123.1223, 12.333)));
}

float hash2(vec2 p){
    p = 50. * fract(p * .3483099 + vec2(.71, .113));
    return fract(p.x * p.y * (p.x + p.y)) * 2. - 1.;
}

float invLerp(float a, float b, float n){
    return clamp((n - a) / (b - a), 0.0, 1.0);
}
float remap(float a, float b, float c, float d, float n){
    return mix(c, d, invLerp(a, b, n));
}

mat2 rotate(float a){
    float c = cos(a);
    float s = sin(a);
    return mat2(float(c), float(s), float(-s), float(c));
}