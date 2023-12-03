#extension GL_OES_standard_derivatives : enable
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

float sdPentagon( in vec2 p, in float r )
{
    const vec3 k = vec3(0.809016994,0.587785252,0.726542528);
    p.x = abs(p.x);
    p -= 2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);
    p -= 2.0*min(dot(vec2( k.x,k.y),p),0.0)*vec2( k.x,k.y);
    p -= vec2(clamp(p.x,-r*k.z,r*k.z),r);    
    return length(p)*sign(p.y);
}

float sdStar5(in vec2 p, in float r, in float rf)
{
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

vec3 hash33(vec3 p ){
    p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
			  dot(p,vec3(269.5,183.3,246.1)),
			  dot(p,vec3(113.5,271.9,124.6)));

	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

mat2 rotate(float a){
    float s = sin(a);
    float c = cos(a);

    return mat2(c, s, -s ,c);
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;

    float cell_width = .1;
    vec2 cell_uv = fract(uv / cell_width) - .5;
    vec2 cell_id = floor(uv / cell_width);
    vec3 cell_hash = (hash33(vec3(cell_id, .5)) + 1.) / 2.;
    cell_uv -= cell_hash.zy * .15;

    float d_pen = sdPentagon(rotate(u_time * cell_hash.x) * cell_uv, .2);
    float d_star = sdStar5(rotate(-u_time * cell_hash.x) * cell_uv, .15, 2.);
    float d = mix(d_pen, d_star, sin(u_time + cell_hash.y) * .5 + .5);
    vec3 col = vec3(1.0-smoothstep(0.0, 0.01, d));

    gl_FragColor = vec4(col, 1.0);
}