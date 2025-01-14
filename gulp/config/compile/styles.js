const
  gulp = require('gulp'),
  cssImport = require('gulp-cssimport'),
  sass = require('gulp-sass')(require('node-sass')),
  $ = require('gulp-load-plugins')();

gulp.task('styles', function () {
  return gulp.src('app/styles/*.scss')
    .pipe($.plumber())
    .pipe(sass().on('error', sass.logError))
    .pipe(cssImport())
    .pipe(gulp.dest('public/styles'));
});
