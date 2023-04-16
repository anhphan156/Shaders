#extension GL_OES_standard_derivatives : enable
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float line_sdf(vec2 p, vec2 a, vec2 b){
    vec2 ab = b - a;
    vec2 ap = p - a;

    float t = clamp(dot(ab, ap) / dot(ab, ab), 0.0, 1.0);

    return length(ap - ab*t);
}

float func(float x){
    float y = sin(x * 10.0) * .2;
    y += sin(x * 40.0) * .1;
    y += sin(x * 80.0) * .05;
    y += sin(x * 150.0) * .01;

    return y;
}

float plot_function(vec2 p){
    float result = 1000.0;

    for(float i = -5.0; i < 5.0; i += 1.0){
        vec2 c1 = p + vec2(1.0 * i, 0.0);
        vec2 c2 = p + vec2(1.0 * (i + 1.0), 0.0);

        vec2 a = vec2(c1.x, func(c1.x + u_time * .3));
        vec2 b = vec2(c2.x, func(c2.x + u_time * .3));

        result = min(result, line_sdf(p, a, b));
    }

    return result;
}

void main(){
    vec2 uv = (gl_FragCoord.xy / u_resolution);
    uv.x *= u_resolution.x / u_resolution.y;

    vec2 grid_uv = uv * 2.0;
    grid_uv = abs(fract(grid_uv / .04) - .5);

    vec2 another_grid_uv = uv * 2.0;
    another_grid_uv = abs(fract(another_grid_uv / .2) - .5);

    float line = smoothstep(.07, .0, .5 - max(grid_uv.x, grid_uv.y));
    float another_line = smoothstep(.03, .0, .5 - max(another_grid_uv.x, another_grid_uv.y));

    vec3 col = vec3(smoothstep(.0, .7, 1. - length(uv - .5)));
    col = mix(col, vec3(0.4), line);
    col = mix(col, vec3(0.2), another_line);
    col = mix(col, vec3(0.0, 0.349, 1.0), smoothstep(0.005, 0.00, abs(uv.y - .5)));
    col = mix(col, vec3(1.0, 0.2353, 0.0), smoothstep(0.005, 0.00, abs(uv.x - .5)));

    col = mix(col, vec3(0.0), smoothstep(.01, .009, plot_function(uv - .5)));

    gl_FragColor = vec4(col, 1.0);
}