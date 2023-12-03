#extension GL_OES_standard_derivatives : enable
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

vec3 hash33(vec3 p );
float gradient_noise(vec3 p);
float turbulance_fbm(vec3 p, float persistence, float lacunartity);

float scene_sdf(vec3 p){
    p = mod(p, 1.0);
    return (length(p - vec3(.5, .5, 0.0)) - 0.20);
}

vec3 normal(vec3 p){
    vec2 e = vec2(0.001, 0.0);

    return normalize(
        vec3(
            scene_sdf(p + e.xyy) - scene_sdf(p - e.xyy),
            scene_sdf(p + e.yxy) - scene_sdf(p - e.yxy),
            scene_sdf(p + e.yyx) - scene_sdf(p - e.yyx)
        )
    );
}

float lighting(vec3 l, vec3 p, vec3 n){
    return dot(normalize(l - p), n); 
}

float ray_march(vec3 ro, vec3 rd){

    float d0 = 0.0;

    for(int i = 0; i < 100; i++){
        float d = scene_sdf(ro + rd * d0);
        d0 += d;

        if(d < 0.01) break;
        if(abs(d0) > 22.0) return 0.;
    }

    return d0;
}

mat2 rotate(float a){
    float s = sin(a);
    float c = cos(a);

    return mat2(s,c,-c,s);
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;
    uv = (uv - .5) * 10.0 * rotate(u_time * .05);

    vec3 ro = vec3(cos(u_time * .05) * 10., 0.0, 2.0 + u_time * .2);
    vec3 rd = normalize(vec3(uv, -3.0));

    float d = ray_march(ro, rd);
    vec3 p = ro + rd * d;
    vec3 n = normal(p);
    float l = lighting(ro, p, n);

    // texture mapping
    p.xy += rd.xy * .20 * n.z;
    vec2 suv = mod(p.xy, 1.0) - .5;
    float noise = turbulance_fbm(vec3(p.xy * 9., u_time * .4), .5, 2.0);

    vec2 psuv = vec2(atan(suv.y, suv.x)/6.28+1.0, length(suv) - .02);
    psuv.x = min(psuv.x, 1.0 - psuv.x) * 5.0 - psuv.y * 3.;
    float eye_streak = turbulance_fbm(vec3(psuv * 4., u_time * .2), .5, 2.0);

    float vein =  clamp(pow(noise, 2.00) * 100., 0.0, 1.0) * l;
    vec3 col = mix(vec3(1.0, 0.0, 0.0), vec3(.5, .5, .8), vein);
    
    vec3 eye_streak_col = mix(vec3(.3, .3, .9), vec3(1.), eye_streak);
    eye_streak_col = mix(vec3(0.0), eye_streak_col,  smoothstep(0.0, 0.03, psuv.y - .005));
    col = mix(col, eye_streak_col, smoothstep(0.04, 0.0, psuv.y - .07));
    col = mix(vec3(0.0), col, smoothstep(0.0, 0.02, abs(psuv.y - .09)));
    

    gl_FragColor = vec4(pow(col, vec3(.4545)), 1.0);
}

float turbulance_fbm(vec3 p, float persistence, float lacunartity){
    float amp = .5;
    float freq = 1.0;
    float total = 0.0;
    float normalization = 0.0;

    for(int i = 0; i < 3; i++){
        total += abs(gradient_noise(p * freq)) * amp;

        normalization += amp;

        amp *= persistence; 
        freq *= lacunartity;
    }

    return total / normalization;
}

float gradient_noise(vec3 p){
    vec3 i = floor( p );
    vec3 f = fract( p );

    vec3 u = f*f*(3.0-2.0*f);

    return mix( mix( mix( dot( hash33( i + vec3(0.0,0.0,0.0) ), f - vec3(0.0,0.0,0.0) ),
                          dot( hash33( i + vec3(1.0,0.0,0.0) ), f - vec3(1.0,0.0,0.0) ), u.x),
                     mix( dot( hash33( i + vec3(0.0,1.0,0.0) ), f - vec3(0.0,1.0,0.0) ), 
                          dot( hash33( i + vec3(1.0,1.0,0.0) ), f - vec3(1.0,1.0,0.0) ), u.x), u.y), 
                     mix( mix( dot( hash33( i + vec3(0.0,0.0,1.0) ), f - vec3(0.0,0.0,1.0) ),                         
                               dot( hash33( i + vec3(1.0,0.0,1.0) ), f - vec3(1.0,0.0,1.0) ), u.x),                   
                          mix( dot( hash33( i + vec3(0.0,1.0,1.0) ), f - vec3(0.0,1.0,1.0) ),                         
                               dot( hash33( i + vec3(1.0,1.0,1.0) ), f - vec3(1.0,1.0,1.0) ), u.x), u.y), u.z );
}

vec3 hash33(vec3 p ){
    p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
			  dot(p,vec3(269.5,183.3,246.1)),
			  dot(p,vec3(113.5,271.9,124.6)));

	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}
