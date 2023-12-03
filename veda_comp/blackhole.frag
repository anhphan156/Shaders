#extension GL_OES_standard_derivatives : enable
precision mediump float;

uniform vec2 resolution;
uniform float time;

void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  uv *= 4.0;
  uv -= vec2(2.0, 2.0);
  uv.x *= resolution.x / resolution.y;

  vec2 bh_anim = vec2(cos(time * .5), 0.0);

  uv += bh_anim;

  vec2 puv = vec2((atan(uv.y, uv.x) + 3.14) / 6.28, length(uv));
  puv.y += 1.3;

  float a = puv.x * 6.28 - 3.14;
  vec2 guv = vec2(cos(a), sin(a)) * puv.y;

  guv -= bh_anim;

  vec2 grid = fract(guv);
  grid = abs(grid - .5);

  float star_anim = mod(time, 10.0) - 5.0;
  vec2 star_uv = vec2(guv.x, abs(guv.y));
  float star = length(star_uv - vec2(star_anim, 2.0)) - .002;

  float star_anim2 = mod(time, 5.0) - 5.0;
  vec2 star_uv2 = vec2(guv.x, abs(guv.y));
  float star2 = length(star_uv2 - vec2(star_anim2, 1.0)) - .002;

  float line = max(grid.x, grid.y);
  float circle = length(uv) - .3;

  vec3 col = vec3(smoothstep(0.45, 0.5, line));
  col = mix(col, vec3(2.), exp(star * -8.0));
  col = mix(col, vec3(2.), exp(star2 * -8.0));
  col = mix(col, vec3(0.), exp(circle * -2.0));

  gl_FragColor = vec4(col, 1.0);
}
