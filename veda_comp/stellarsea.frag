/*{
    "PASSES": [{
        "TARGET": "buffer0",
    },
    {
        "TARGET": "buffer1",
    }
    ]
}*/
#extension GL_OES_standard_derivatives : enable
precision mediump float;

#define r 3.0

uniform int PASSINDEX;
uniform sampler2D buffer0;
uniform sampler2D buffer1;

uniform vec2 resolution;
uniform float time;

vec3 hash33(vec3 p);
float gradient_noise(vec3 p);

float GaussianFunction(float x);
vec3 GaussianBlur(sampler2D b, vec2 uv);

vec3 StarGrid(vec2 uv, float size, float density, float seed, float twinkle_brightness);

float turbulance_fbm(vec3 p, float persistence, float lacunartity);

void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  uv.x *= resolution.x / resolution.y;

  vec2 noise_uv = (uv * vec2(.25, 1.0)) / 2.0 - .25;
  noise_uv.x += .08;
  vec2 polar_uv = vec2((atan(noise_uv.y, noise_uv.x) + 3.14) / 6.28, length(noise_uv));

  vec2 a = polar_uv;
  a.x -= sin(time) * .001 - a.y * .0001;
  a.x = fract(a.x);
  vec2 star_uv = vec2(cos(a.x * 6.28 - 3.14), sin(a.x * 6.28 - 3.14)) * a.y;
  star_uv += .17;
  star_uv *= 2.0;
  star_uv /= vec2(.25, 1.0);

  polar_uv.x -= fract(time * .01) - polar_uv.y * 1.8;
  polar_uv.x = fract(polar_uv.x);
  polar_uv.x = min(polar_uv.x, 1.0 - polar_uv.x);
  polar_uv.y += time * .01;

  float size = 0.05;
  float density = 0.3;
  float twinkle_brightness = .08;

  vec3 star_col = vec3(0.0);
  for(float i = 0.0; i <= 3.0; i += 1.0){
    star_col += StarGrid(star_uv, size * (1.2 - uv.y), density, i * 5.0, twinkle_brightness);
    size *= .8;
    density *= .8;
    twinkle_brightness *= 3.0;
  }

  // star color
  vec3 col = vec3(0.0);
  col = mix(col, star_col * 5.0, star_col);

  if(PASSINDEX == 0){
    gl_FragColor = vec4(pow(col, vec3(.4545)), 1.0);
  }else if(PASSINDEX == 1){
    vec3 blur_col = GaussianBlur(buffer0, gl_FragCoord.xy / resolution.xy);
    col += blur_col;

    // background color
    float noise = turbulance_fbm(vec3(polar_uv * 10.0, time * .2), .5, 2.0);
    float noise2 = turbulance_fbm(vec3(uv * 2.0, time * .3), .5, 2.0);

    vec3 bg_col = mix(vec3(0.0), vec3(0.3, 0.3, 0.8), noise * .2);
    vec3 bg_col2 = mix(vec3(0.2, .2, .2), vec3(1.1, .5, .5), noise2 * 2.0);

    col += mix(bg_col, bg_col2, .06);

    // tone mapping
    col = (col * (2.51 * col + .03)) / (col * (2.43 * col + .59) + .14);
    col = clamp(col, .0, 1.0);

    gl_FragColor = vec4(pow(col, vec3(.4545)), 1.0);
  }

}

vec3 StarGrid(vec2 uv, float size, float density , float seed, float twinkle_brightness){
    float cell_width = density;
    vec2 cell_uv = fract(uv / cell_width) - .5;
    vec2 cell_id = floor(uv / cell_width);
    vec3 cell_hash = hash33(vec3(cell_id, seed));

    float star_r = size;
    float star_brightness = clamp(cell_hash.z, 0.0, 1.0) * (sin(time * 5.0 + cell_hash.z * 25.0) * .2 + .8);
    vec2 star_pos = cell_hash.xy * (cell_width * .5 - star_r * 2.0);
    float star_d = length(cell_uv - star_pos);
    vec3 star = vec3(exp(-2.0 * star_d / star_r));

    float twinkle_size = star_r * .2;
    float twinkle_length = star_r * 5. * (sin(time) * .2 + .8);
    vec2 twinkle_pos = abs(cell_uv - star_pos);
    float twinkle_hor = smoothstep(twinkle_length, 0.0, twinkle_pos.x) * smoothstep(twinkle_size, 0.0, twinkle_pos.y);
    float twinkle_ver = smoothstep(twinkle_length, 0.0, twinkle_pos.y) * smoothstep(twinkle_size, 0.0, twinkle_pos.x);
    float twinkle = max(twinkle_hor, twinkle_ver);

    return (star + twinkle * twinkle_brightness) * star_brightness * cell_hash;
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

float GaussianFunction(float x){
  return exp(-.5 * pow(3.14 * x, 2.0));
}

vec3 GaussianBlur(sampler2D b, vec2 uv){

  float weight_sum = 0.0;
  vec3 pixel_sum = vec3(0.0);

  for(float x = -r; x <= r; x += 1.0){
    for(float y = -r; y <= r; y += 1.0){
        vec2 offset = uv + vec2(x,y) * (1.0 / resolution);

        float weight = GaussianFunction(x / r) * GaussianFunction(y / r);
        vec3 pixel_col = texture2D(b, offset).xyz * weight;

        weight_sum += weight;
        pixel_sum += pixel_col;
    }
  }
  return pixel_sum / weight_sum;
}
