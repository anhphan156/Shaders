#extension GL_OES_standard_derivatives : enable
#ifdef GL_ES
precision highp float;
#endif

uniform float u_time;
uniform vec2 u_resolution;

uniform sampler2D u_buffer0;
uniform sampler2D u_buffer1;

#define N 11
#define PI 3.14159

struct Fourier {
    vec2 complex_number;
    float amp;
    float freq;
    float phase;
};

void get_signal(inout vec2 signal[N]);
void sort(inout Fourier[N] fourier_series);

float line(vec2 a, vec2 b, vec2 uv){
    vec2 ap = uv - a, ab = b - a;
    float t = clamp(dot(ap, ab) / dot(ab, ab), 0., 1.);
    // vec2 c = a + ab * clamp(sin(u_time)*.5 + .5, 0., t);
    vec2 c = a + ab * t;
    float d = length(uv - c);

    return smoothstep(fwidth(d), 0., d - .001);
}

float circle(vec2 c, vec2 uv, float r){
    float d = length(uv - c);
    return smoothstep(fwidth(d), 0., d - r) - smoothstep(fwidth(d), 0. - .009, d - r);
}

vec2 complex_multiplication(vec2 a, vec2 b){
    return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

void dft(vec2[N] x, inout Fourier[N] fourier_series){
    for(int k = 0; k < N; k++){
        fourier_series[k].complex_number = vec2(0.);
        for(int n = 0; n < N; n++){
            float phi = (2. * PI * float(k) * float(n)) / float(N);
            vec2 sth = vec2(cos(phi), -sin(phi));
            fourier_series[k].complex_number += complex_multiplication(x[n], sth);
        }
        fourier_series[k].complex_number *= 1. / float(N);

        fourier_series[k].freq = float(k);
        fourier_series[k].phase = atan(fourier_series[k].complex_number.y, fourier_series[k].complex_number.x);
        fourier_series[k].amp = length(fourier_series[k].complex_number);
    }
}

float ani = mod(u_time + (2. * PI) / float(N), 10.)* .1;
vec3 epicycles(Fourier[N] fourier_series, vec2 uv){
    vec3 col = vec3(0.);
    vec2 c0 = vec2(0.);

    for(int i = 0; i < N ; i++){
        vec2 c = c0 + vec2(fourier_series[i].amp * cos(ani * fourier_series[i].freq + fourier_series[i].phase), fourier_series[i].amp * sin(ani * fourier_series[i].freq + fourier_series[i].phase));
        col = mix(col, vec3(1.), circle(c0, uv, fourier_series[i].amp)); 
        col = mix(col, vec3(1.), line(c0, c, uv));

        c0 = c;
    }

    return col;
}

vec3 trace_line(Fourier[N] fourier_series, vec2 uv){
    vec3 col = vec3(0.);
    vec2 c0 = vec2(0.);

    for(int i = 0; i < N ; i++){
        c0 += vec2(fourier_series[i].amp * cos(ani * fourier_series[i].freq + fourier_series[i].phase), fourier_series[i].amp * sin(ani * fourier_series[i].freq + fourier_series[i].phase));
    }

    col = vec3(circle(c0, uv, .001));

    return col;
}


#if defined(BUFFER_0)

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution;
    uv -= .5;
    uv *= 2.;
    uv.x *= u_resolution.x / u_resolution.y;

    vec3 b1 = texture2D(u_buffer0, gl_FragCoord.xy / u_resolution).rgb;

    vec2 signal[N];
    get_signal(signal);

    Fourier fourier_series[N];
    dft(signal, fourier_series);

    vec3 col = trace_line(fourier_series, uv);

    col = mix(col, vec3(0.251, 1.0, 0.349), b1);

    gl_FragColor = vec4(col, 1.); 
}

#elif defined(BUFFER_1)

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution;
    uv -= .5;
    uv *= 2.;
    uv.x *= u_resolution.x / u_resolution.y;

    vec3 b0 = texture2D(u_buffer0, gl_FragCoord.xy / u_resolution).rgb;

    vec2 signal[N];
    get_signal(signal);

    Fourier fourier_series[N];
    dft(signal, fourier_series);

    vec3 col = epicycles(fourier_series, uv);

    col = mix(col, vec3(1.), b0);
    gl_FragColor = vec4(col, 1.); 
}

#else

void main(){
    vec3 b1 = texture2D(u_buffer1, gl_FragCoord.xy / u_resolution).rgb;
    gl_FragColor = vec4(b1, 1.);
}

#endif


void get_signal(inout vec2 signal[N]){
    // signal[ 0] = vec2( 0.422, 0.136 );
    // signal[ 1] = vec2( 0.371, 0.085 );
    // signal[ 2] = vec2( 0.422, 0.136 );
    // signal[ 3] = vec2( 0.371, 0.085 );
    // signal[ 4] = vec2( 0.449, 0.140 );
    // signal[ 5] = vec2( 0.352, 0.187 );
    // signal[ 6] = vec2( 0.379, 0.202 );
    // signal[ 7] = vec2( 0.398, 0.202 );
    // signal[ 8] = vec2( 0.266, 0.198 );
    // signal[ 9] = vec2( 0.318, 0.345 ); 
    // signal[10] = vec2( 0.402, 0.359 );
    // signal[11] = vec2( 0.361, 0.425 );
    // signal[12] = vec2( 0.371, 0.521 );
    // signal[13] = vec2( 0.410, 0.491 );
    // signal[14] = vec2( 0.410, 0.357 );
    // signal[15] = vec2( 0.502, 0.482 );
    // signal[16] = vec2( 0.529, 0.435 );
    // signal[17] = vec2( 0.426, 0.343 );
    // signal[18] = vec2( 0.449, 0.343 );
    // signal[19] = vec2( 0.504, 0.335 );
    // signal[20] = vec2( 0.664, 0.355 );
    // signal[21] = vec2( 0.748, 0.208 );
    // signal[22] = vec2( 0.738, 0.277 );
    // signal[23] = vec2( 0.787, 0.308 );
    // signal[24] = vec2( 0.748, 0.183 );
    // signal[25] = vec2( 0.623, 0.081 );
    // signal[26] = vec2( 0.557, 0.099 );
    // signal[27] = vec2( 0.648, 0.116 );
    // signal[28] = vec2( 0.598, 0.116 );
    // signal[29] = vec2( 0.566, 0.195 );
    // signal[30] = vec2( 0.584, 0.228 );
    // signal[31] = vec2( 0.508, 0.083 );
    // signal[32] = vec2( 0.457, 0.140 );
    // signal[33] = vec2( 0.508, 0.130 );
    // signal[34] = vec2( 0.625, 0.071 );
    // signal[35] = vec2( 0.818, 0.093 );
    // signal[36] = vec2( 0.951, 0.066 );
    // signal[37] = vec2( 0.547, 0.081 );

signal[0] =   vec2(-.7523920093800275, -.9276916512631997 );
signal[1] =  vec2( -.7399534065831229, -.9582732689485699 );
signal[2] =  vec2( -.7274106439694725, -.989162195029445 );
signal[3] =  vec2( -.714876893765498, -.10200732827734575 );
signal[4] =  vec2( -.7023509740158319, -.10510035772921889 );
signal[5] =  vec2( -.6898192922337502, -.10820003568003328 );
signal[6] =  vec2( -.6772920427842959, -.11130281626368685 );
signal[7] =  vec2( -.6647577016026378, -.1144115066241771 );
signal[8] =  vec2( -.6522337025304437, -.11752211766213923 );
signal[9] =  vec2( -.6397037936814129, -.12063908171020076 );
signal[10] =  vec2( -.62718127205342796, -.12376092132415248 );
// signal[11] =  vec2( -61.46532838818692,  -12.689014815915003 );
// signal[12] =  vec2( -60.21245569882057,  -13.002602349308878 );
// signal[13] =  vec2( -58.96055812263228,  -13.316706988175959 );
// signal[14] =  vec2( -57.708867388633266, -13.631609446915984 );
// signal[15] =  vec2( -56.45698458688706,  -13.947679086581244 );
// signal[16] =  vec2( -55.205279078445955, -14.26490113272965 );
// signal[17] =  vec2( -53.95457823206708,  -14.583246036477012 );
// signal[18] =  vec2( -52.703685317941016, -14.903703685443475 );
// signal[19] =  vec2( -51.4546244346343, -15.226096786323936 );
// signal[20] =  vec2( -50.20482482922301,  -15.552168723285197 );
// signal[21] =  vec2( -48.95740390898846,  -15.881313744201512 );
// signal[22] =  vec2( -47.70490058067441,  -16.19289195347093 );
// signal[23] =  vec2( -46.448230859690526,  -16.486223726757242 );
// signal[24] =  vec2( -45.188059595930945,  -16.76634714881368 );
// signal[25] =  vec2( -43.92584945916273,  -17.036571694668755 );
// signal[26] =  vec2( -42.66235394593253,  -17.29898056065738 );
// signal[27] =  vec2( -41.39749918402992,  -17.555272807620092 );
// signal[28] =  vec2( -40.131196526802334,-17.806852007555587 );
// signal[29] =  vec2( -38.863977854165064, -18.05438301035799 );
// signal[30] =  vec2( -37.596847828180344, -18.298604538131876 );
// signal[31] =  vec2( -36.32874268901758,  -18.540255312981827 );
// signal[32] =  vec2( -35.0599579255186,  -18.77966037263386 );
// signal[33] =  vec2( -33.79075947764106, -19.017455018097905 );
// signal[34] =  vec2( -32.52221110521555,  -19.25356537716351 );
// signal[35] =  vec2( -31.253544537253305, -19.488479006419706 );
// signal[36] =  vec2( -29.984612029333412, -19.72252094359249 );
// signal[37] =  vec2( -28.71429072385691,  -19.956178745270893 );
}