#extension GL_OES_standard_derivatives : enable
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

float line_sdf( in vec2 p, in vec2 a, in vec2 b )
{
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h );
}

float sd_box( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

float sdEquilateralTriangle( in vec2 p, in float r )
{
    const float k = sqrt(3.0);
    p.x = abs(p.x) - r;
    p.y = p.y + r/k;
    if( p.x+k*p.y>0.0 ) p = vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;
    p.x -= clamp( p.x, -2.0*r, 0.0 );
    return -length(p)*sign(p.y);
}

float sdVesica(vec2 p, float r, float d)
{
    p = abs(p);
    float b = sqrt(r*r-d*d);
    return ((p.y-b)*d>p.x*b) ? length(p-vec2(0.0,b))
                             : length(p-vec2(-d,0.0))-r;
}

mat2 rotate(float a){
    float s = sin(a);
    float c = cos(a);

    return mat2(c, s, -s, c);
}

float line(vec2 p, float a, vec2 start){
    p -= start;
    p *= rotate(a);
    float line =  line_sdf(p, vec2(0.0, 0.0), vec2(0.3, 0.0)) - .002;
    float tri = sdEquilateralTriangle(p * rotate(-3.14/2.) - vec2(0.0, .3), .02);

    return min(line, tri);
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;
    uv.x -= .13;

    //grid
    vec2 bcuv = fract(uv * 10.0) - .5;
    vec2 scuv = fract(bcuv * 4.0) - .5;
    float a = .5 - max(abs(bcuv.x), abs(bcuv.y));
    a = smoothstep(0.00, 0.04, a);
    float b = .5 - max(abs(scuv.x), abs(scuv.y));
    b = smoothstep(0.02, 0.035, b);

    // shapes
    // box
    float box = sd_box(uv - vec2(.45, .3), vec2(.35, .1));

    // eye
    float eye = sdVesica((uv - vec2(.85,.53)) * 4.0 * rotate(3.14/2.), .6, .7) - .2;
    float eye_ball = length(uv - vec2(.85, .53)) - .02;

    // sun
    vec2 sun_pos = vec2(.1,.75);
    float sun = length(uv - sun_pos) - .1;
    float angle = 0.0;
    float ray = 10.0;
    for(int i = 0; i < 10; i++){
        angle += 6.28 / 10.;
        vec2 start = vec2(cos(angle), sin(angle)) * .2 + sun_pos;
        vec2 end = sun_pos;
        ray = min(ray, line_sdf(uv, start, end) - .005);
    }

    // vectors
    float normal = line(uv, 3.1415/2., vec2(0.45, 0.4));
    float r_light = line(uv, 3.1415/4., vec2(0.45, 0.4));
    float view = line(uv, 3.1415/8., vec2(0.45, 0.4));
    float light = line(uv, 3.1415*3./4., vec2(0.45, 0.4));
    float vec = min(normal, r_light);
    vec = min(vec, view);
    vec = min(vec, light);

    vec3 vec_col = vec3(0.0);
    if(vec == r_light){
        vec_col = vec3(.8, .3, .2);
    }else if(vec == view){
        vec_col = vec3(.8, .3, .8);
    }else if(vec == light){
        vec_col = vec3(.7, .7, .2);
    }

    vec3 col = mix(vec3(.1, .1, .1), vec3(.85), b);
    col = mix(vec3(.8, .2, .2), col, a);
    col = mix(vec_col, col, smoothstep(0.0, 0.005, vec));
    col = mix(vec3(.3,.6,.2), col, smoothstep(0.0, 0.005, box));
    col = mix(vec3(.6, .3, .3), col, smoothstep(0.0, 0.005, eye));
    col = mix(vec3(.1), col, smoothstep(0.0, 0.005, eye_ball));
    col = mix(vec3(.8,.9,.2), col, smoothstep(0.0, 0.005, sun));
    col = mix(vec3(.8,.9,.2), col, smoothstep(0.0, 0.005, ray));

    col *= 1.35 - length(uv - .5);

    gl_FragColor = vec4(col, 1.0);
}