#ifdef GL_ES
precision mediump float;
#endif

#define MAX_STEP 100
#define MAX_DIST 50.0
#define SURF_DIST 0.001

uniform vec2 u_resolution;
uniform float u_time;

float smin( float a, float b, float k );
mat2 rotate(float a);
float scene(vec3 p);
vec3 normal(vec3 p);
float ray_marching(vec3 ro, vec3 rd);

float sd_line( vec3 p, vec3 a, vec3 b ){
    vec3 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h );
}

float sd_cone(vec3 p, vec2 c, float h){
	float q = length(p.xz);
	return max(dot(c.xy, vec2(q,p.y)), -h - p.y);
}

void main(){
	vec2 uv = gl_FragCoord.xy / u_resolution;
	uv.x *= u_resolution.x / u_resolution.y;
	uv -= .5;

	vec3 ro = vec3(0.0,1.5, 5.0);
	vec3 rd = normalize(vec3(uv, -2.0));
	rd.yz *= rotate(-0.25);

	vec3 col = vec3(0.0);
	float d = ray_marching(ro, rd);
	if(d < MAX_DIST){
		vec3 p = ro + rd * d;
		vec3 n = normal(p);

		vec3 l = normalize(ro-p);
		col = vec3(dot(n,l));
	}

	gl_FragColor = vec4(col, 1.0);
}

float scene(vec3 p){
	float sphere = length(p - vec3(.0, .5, .0)) - .2;
	float line = sd_line(p, vec3(0.0, -.5, 0.0), vec3(0.0, .5, 0.0)) - .1;
	float cone = sd_cone(p - vec3(.0, .35, .0), vec2(.5, 1.9), .1);

	float cone2 = sd_cone(p - vec3(.0, -.5, .0), vec2(.2, .9), .10);

	float d = smin(line,cone, .01);
	d = smin(d, sphere, .025);
	d = smin(d, cone2, .5);

	float plane = dot(p - vec3(0., -1.0, .0), normalize(vec3(.0, 1., .0)));
	d = min(d,plane);


	return d;
}

vec3 normal(vec3 p){
	vec2 e = vec2(0.001, 0.0);

	return normalize(vec3(
		scene(p + e.xyy) - scene(p - e.xyy),
		scene(p + e.yxy) - scene(p - e.yxy),
		scene(p + e.yyx) - scene(p - e.yyx)
	));
}

float ray_marching(vec3 ro, vec3 rd){
	float d0 = 0.0;
	
	int i = 0;
	for(i = 0; i < MAX_STEP; i += 1){
		float d = scene(ro + rd*d0);
		d0 += d;

		if(d < SURF_DIST || abs(d0) >= MAX_DIST) break;
	}

	if (i == MAX_STEP - 1){
		d0 = MAX_DIST;
	}

	return d0;
}

mat2 rotate(float a){
	float c = cos(a);
	float s = sin(a);

	return mat2(c,-s,s,c);
}

float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}
