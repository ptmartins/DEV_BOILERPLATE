import gulp from 'gulp';
import yargs from 'yargs';
import cleanCSS from 'gulp-clean-css';
import gulpif from 'gulp-if';
import sourcemaps from 'gulp-sourcemaps';
import del from 'del';
import webpack from 'webpack-stream';
import uglify from 'gulp-uglify';
import browserSync from 'browser-sync';
import zip from 'gulp-zip';
import replace from 'gulp-replace';
import info from './package.json';
import concat from 'gulp-concat';

const sass = require('gulp-sass')(require('sass'));
const server = browserSync.create();
const PRODUCTION = yargs.argv.prod;

const paths = {
  styles: {
    src: 'src/sass/main.scss',
    dest: 'dist/css/'
  },
  scripts: {
    src: 'src/js/bundle.js',
    dest: 'dist/js/'
  },
  images: {
    src: 'src/images/**/*.{jpg,jpeg,png,svg,gif}',
    dest: 'dist/images/'
  },
  other: {
    src: ['src/**/*', '!src/{images,js,sass}', '!src/{images,js,sass}/**/*'],
    dest: 'dist/'
  },
  package : {
    src: ['**/*', '!node_modules{,/**}', '!packaged{,/**}', '!.git{,/**}','!src{,/**}',
    '!.gitignore', '!gulpfile.babel.js', '!package.json', '!package-lock.json',
    '!git.txt', '!npm-install.txt'],
    dest: 'packaged'
  }
}

// SASS/CSS task
export const styles = (done) => {
  return gulp.src(paths.styles.src)
    .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
    .pipe(sass().on('error', sass.logError))
    .pipe(gulpif(PRODUCTION, cleanCSS({compatibility: 'ie11'})))
    .pipe(gulpif(!PRODUCTION, sourcemaps.write()) )
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(server.stream());
}

// JS Scripts task
export const scripts = () => {
    return gulp.src(paths.scripts.src)
        .pipe(webpack({
              module: {
                  rules: [
                    {
                          test: /\.js$/,
                          use: {
                              loader: 'babel-loader',
                              options: {
                                presets: ['@babel/preset-env']
                              }
                          }
                    }
                  ]
              },
              output: {
                filename: '[name].js'
              },
              devtool: !PRODUCTION ? 'source-map' : false,
              mode: PRODUCTION ? 'production' : 'development'
      }))
	    .pipe(gulp.dest(paths.scripts.dest));
}

// Copy images from src/images -> dist/images
export const images = () => {
  return gulp.src(paths.images.src)
    .pipe(gulp.dest(paths.images.dest));
}

// Copy all other files from /src to /dist
export const copy = () => {
  return gulp.src(paths.other.src)
    .pipe(gulp.dest(paths.other.dest));
    done();
}

// Delete /dist folder do we can rebuild it from scratch
export const clean = () => del(['dist']);

// Create Development server at port 3000
export const serve = (done) => {
  server.init({
    server: {
      baseDir: "./dist"
    }
  });
  done();
}

// Reload development server
export const reload = (done) => {
  server.reload();
  done();
}

// Compress project in .zip format
export const compress = () => {
  return gulp.src(paths.package.src)
  .pipe(replace('_themename', info.name))
  .pipe(replace('_version', info.version))
  .pipe(zip(`${info.name}.zip`))
  .pipe(gulp.dest(paths.package.dest));
}

// Watch for changes
export const watch = () => {
  gulp.watch('src/sass/**/*.scss', styles);
  gulp.watch('src/js/**/*.js', gulp.series(scripts, reload));
  gulp.watch('src/**/*.php', reload);
  gulp.watch('src/**/*.html', reload);
  gulp.watch(paths.images.src, images, reload);
  gulp.watch(paths.other.src, copy, reload)
}

export const dev = gulp.series(clean, gulp.parallel(styles,scripts,images,copy), serve, watch);
export const build = gulp.series(clean, gulp.parallel(styles,scripts,images,copy));
export const bundle = gulp.series(build, compress);

// Default function
export default dev;
