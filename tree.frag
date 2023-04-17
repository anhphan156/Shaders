#extension GL_OES_standard_derivatives : enable
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

float hash21(vec2 p);
vec3 hash33(vec3 p );
float gradient_noise(vec3 p);

float fbm(vec3 p, float octave, float persistence, float lacunartity);

float sdTriangleIsosceles( in vec2 p, in vec2 q );
float sdSegment( in vec2 p, in vec2 a, in vec2 b );
float tree_sdf(vec2 p);
float mountain_sdf(vec4 p);

float invLerp(float a, float b, float n);
float remap(float a, float b, float c, float d, float n);

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution;
    uv.x *= u_resolution.x / u_resolution.y;
    uv.y += .2;

    vec3 col = vec3(.0);

    const float NUM_MOUNTAINS = 5.0;
    for(float i = 0.0; i <= NUM_MOUNTAINS; i += 1.0){
        float mountain_spacing =  3.5 - pow(i / 10. , .9); // todo use natural log to fix mountain distance
        vec2 mountain_uv = uv * 5.0 - vec2(u_time * (i + 0.5) * .1, mountain_spacing);
        float mountain_d = mountain_sdf(vec4(mountain_uv * pow((NUM_MOUNTAINS + 1.) - i, .4), NUM_MOUNTAINS - i, i / 9. + 1.));
        vec3 mountain_col = mix(vec3(0.7765, 0.8706, 0.9137), vec3(0.2078, 0.5922, 0.9529), mountain_uv.y);
        col = mix(col, mountain_col * (1. / (1. + i)), smoothstep(.005, 0.0, mountain_d));

        for(float j = 0.0; j <= 3.0; j += 1.0){

            float tree_scale = (NUM_MOUNTAINS - i) * .8;
            vec2 tree_uv = mountain_uv * tree_scale + vec2(j * 2.9, 0.0);
            tree_uv.x = mod(tree_uv.x , 5.0 * tree_scale);
            float tree_d = tree_sdf(tree_uv - vec2(0.5, .4));
            col = mix(col, vec3(0.8) * (1. / (1. + i)), smoothstep(.005, 0.0, tree_d));
        }
    }

    col = mix(col, vec3(.5), 0.3/length(uv * 2.5  - vec2(1.5, 2.8)));

    gl_FragColor = vec4(col, 1.0);
}

float mountain_sdf( vec4 p){
    float y = fbm(vec3(p.x, 0.0, p.z), p.z, 0.5, 2.0) * p.w;

    return p.y - y;
}

float tree_sdf(vec2 p){
    float triangle1 = sdTriangleIsosceles(p - vec2(0.0, .6), vec2(.2, -.3));
    float triangle2 = sdTriangleIsosceles(p - vec2(0.0, .5), vec2(.3, -.4));
    float triangle3 = sdTriangleIsosceles(p - vec2(0.0, .3), vec2(.4, -.45));

    float leaves = min(triangle1, min(triangle2, triangle3)) - .005;

    float trunk = sdSegment(p - vec2(0.0, -.5), vec2(0.0, -5.0), vec2(0.0, .5)) - .04;
    
    return min(leaves, trunk);
}

float sdTriangleIsosceles( in vec2 p, in vec2 q )
{
    p.x = abs(p.x);
    vec2 a = p - q*clamp( dot(p,q)/dot(q,q), 0.0, 1.0 );
    vec2 b = p - q*vec2( clamp( p.x/q.x, 0.0, 1.0 ), 1.0 );
    float s = -sign( q.y );
    vec2 d = min( vec2( dot(a,a), s*(p.x*q.y-p.y*q.x) ),
                  vec2( dot(b,b), s*(p.y-q.y)  ));
    return -sqrt(d.x)*sign(d.y);
}

float sdSegment( in vec2 p, in vec2 a, in vec2 b )
{
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h );
}

float fbm(vec3 p, float octave, float persistence, float lacunartity){
    float amp = .5;
    float freq = 0.3;
    float total = 0.0;
    float normalization = 0.0;

    for(int i = 0; i < 99; i += 1){
        total += gradient_noise(p * freq) * amp;

        normalization += amp;

        amp *= persistence; 
        freq *= lacunartity;

        if(i >= int(octave)) break;
    }

    return total / normalization;
}

float hash21(vec2 p){
    p = 50. * fract(p * .3183099 + vec2(.71, .113));
    return -1. + 2.* fract(p.x * p.y * (p.x + p.y));
}

vec3 hash33(vec3 p ){
    p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
			  dot(p,vec3(269.5,183.3,246.1)),
			  dot(p,vec3(113.5,271.9,124.6)));

	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
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

float invLerp(float a, float b, float n){
    return clamp((n - a) / (b - a), 0.0, 1.0);
}
float remap(float a, float b, float c, float d, float n){
    return mix(c, d, invLerp(a, b, n));
}