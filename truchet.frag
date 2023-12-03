#extension GL_OES_standard_derivatives : enable
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

vec3 hash33(vec3 p ){
    p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
			  dot(p,vec3(269.5,183.3,246.1)),
			  dot(p,vec3(113.5,271.9,124.6)));

	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;
    
    // uv.x -= u_time * .1;

    float cell_width = 0.09;
    vec2 cell_uv = fract(uv / cell_width);
    vec2 cell_id = floor(uv / cell_width);
    vec3 cell_hash = hash33(vec3(cell_id, .5));

    vec2 line_uv = mix(cell_uv, vec2(1.0 - cell_uv.x, cell_uv.y), cell_hash.y > 0.0 ? 1.0 : 0.0);
    float line = smoothstep(0.15, 0.20, abs(abs(line_uv.x - line_uv.y) - .5));

    vec3 col = vec3(line);

    gl_FragColor = vec4(col, 1.0);
}