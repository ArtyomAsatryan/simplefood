const { src, dest, watch, parallel, series } = require("gulp");

const scss = require("gulp-sass")(require("sass"));
const concat = require("gulp-concat");
const autoprefixer = require("gulp-autoprefixer");
const gulpUglify = require("gulp-uglify");
const imagemin = require("gulp-imagemin");
const rename = require("gulp-rename");
const nunjucksRender = require("gulp-nunjucks-render");
const del = require("del");
const browserSync = require("browser-sync").create();
const svgSprite = require("gulp-svg-sprite");
const cheerio = require("gulp-cheerio");
const replace = require("gulp-replace");

function svgSprites() {
  return src("app/images/icons/*.svg")
    .pipe(
      cheerio({
        run: ($) => {
          $("[fill]").removeAttr("fill"); // очищаем цвет у иконок по умолчанию, чтобы можно было задать свой
          $("[stroke]").removeAttr("stroke"); // очищаем, если есть лишние атрибуты строк
          $("[style]").removeAttr("style"); // убираем внутренние стили для иконок
        },
        parserOptions: { xmlMode: true },
      })
    )
    .pipe(replace("&gt;", ">"))
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: "../sprite.svg",
          },
        },
      })
    )
    .pipe(dest("app/images"));
}
function browsersync() {
  browserSync.init({
    server: {
      baseDir: "app/",
    },
    notify: false,
  });
}

function nunjucks() {
  return src("app/*.njk")
    .pipe(nunjucksRender())
    .pipe(dest("app"))
    .pipe(browserSync.stream());
}

function styles() {
  return (
    src("app/scss/*.scss")
      .pipe(scss({ outputStyle: "compressed" }))
      // .pipe(concat())
      .pipe(
        rename({
          suffix: ".min",
        })
      )
      .pipe(
        autoprefixer({
          overrideBrowserslist: ["last 10 versions"],
          grid: true,
        })
      )
      .pipe(dest("app/css"))
      .pipe(browserSync.stream())
  );
}

function scripts() {
  return src([
    "node_modules/jquery/dist/jquery.js",
    "node_modules/slick-carousel/slick/slick.js",
    "node_modules/mixitup/dist/mixitup.js",
    "app/js/main.js",
  ])
    .pipe(concat("main.min.js"))
    .pipe(gulpUglify())
    .pipe(dest("app/js"))
    .pipe(browserSync.stream());
}

function images() {
  return src("app/images/**/*.*")
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ quality: 75, progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [
            {
              name: "removeViewBox",
              active: true,
            },
            {
              name: "cleanupIDs",
              active: false,
            },
          ],
        }),
      ])
    )
    .pipe(dest("dist/images"));
}

function build() {
  return src(["app/**/*.html", "app/css/style.min.css", "app/js/main.min.js"], {
    base: "app",
  }).pipe(dest("dist"));
}

function cleanDist() {
  return del("dist");
}

function watching() {
  watch(["app/**/*.scss"], styles);
  watch(["app/*.njk"], nunjucks);
  watch(["app/js/**/*.js", "!app/js/main.min.js"], scripts);
  watch(["app/**/*.html"]).on("change", browserSync.reload);
  watch(["app/images/icons/*.svg"], svgSprites);
}

exports.styles = styles;
exports.scripts = scripts;
exports.browsersync = browsersync;
exports.svgSprites = svgSprites;
exports.watching = watching;
exports.images = images;
exports.nunjucks = nunjucks;
exports.cleanDist = cleanDist;
exports.build = series(cleanDist, images, build);

exports.default = parallel(
  svgSprites,
  nunjucks,
  styles,
  scripts,
  browsersync,
  watching
);
