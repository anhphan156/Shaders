#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;

vec3 black = vec3(0.);
vec3 white = vec3(243.0, 234.0, 217.0) / 255.0;
vec3 red = vec3(165.0, 32.0, 35.0) / 255.0;
vec3 yellow = vec3(251.0, 191.0, 51.0) / 255.0;
vec3 blue = vec3(0, 93.0, 154.0) / 255.0;

float stripe(float a, float b, float uv){
    float aborder = step(a, uv);
    float bborder = step(1. - b, 1. - uv);

    return aborder * bborder;
}

float rec(vec2 topleft, float width, float length, vec2 uv){
    return stripe(topleft.x, topleft.x + length, uv.x) * stripe(topleft.y - width, topleft.y, uv.y);
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;

    // first col
    float red1 = rec(vec2(.1, 1.), .2, .11, uv);
    float red2 = rec(vec2(.0, 1.), .2, .08, uv);
    float red3 = rec(vec2(.0, .78), .2, .08, uv);
    float red4 = rec(vec2(.1, .78), .2, .11, uv);

    float ltw = rec(vec2(0., .56), .56, .21, uv);

    // second col
    float white21 = rec(vec2(.23, 1.), .2, .38, uv);
    float white22 = rec(vec2(.23, .78), .2, .38, uv);
    float white23 = rec(vec2(.23, .56), .47, .38, uv);
    float white24 = rec(vec2(.23, .07), .1, .38, uv);

    // third col
    float white31 = rec(vec2(.63, 1.), .2, .15, uv);
    float white32 = rec(vec2(.63, .78), .2, .15, uv);
    float white33 = rec(vec2(.63, .56), .47, .15, uv);
    float white34 = rec(vec2(.63, .07), .1, .15, uv);

    // forth col
    float yellow41 = rec(vec2(.80, 1.), .2, .15, uv);
    float yellow42 = rec(vec2(.80, .78), .2, .15, uv);
    float yellow43 = rec(vec2(.80, .56), .47, .15, uv);
    float yellow44 = rec(vec2(.80, .07), .1, .15, uv);

    // first col mixing
    vec3 col = mix(black, red, red1);
    col = mix(col, red, red2);
    col = mix(col, red, red3);
    col = mix(col, red, red4);
    col = mix(col, white, ltw);

    // second col mixing
    col = mix(col, white, white21);
    col = mix(col, white, white22);
    col = mix(col, white, white23);
    col = mix(col, white, white24);

    // third col mixing
    col = mix(col, white, white31);
    col = mix(col, white, white32);
    col = mix(col, white, white33);
    col = mix(col, blue, white34);

    // forth col mixing
    col = mix(col, yellow, yellow41);
    col = mix(col, yellow, yellow42);
    col = mix(col, white, yellow43);
    col = mix(col, blue, yellow44);

    gl_FragColor = vec4(col, 1.);
}