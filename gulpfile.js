var gulp = require('gulp');
var typescript = require('gulp-tsc');
var uglify = require('gulp-uglifyjs');

gulp.task('default', function () {
    gulp.src(['src/**/*.ts'])
        .pipe(typescript({ out: "vismodel.js", target: "es5" }))
        .pipe(gulp.dest('build/'));
});

gulp.task('tsc', function () {
    gulp.src(['src/**/*.ts'])
        .pipe(typescript({ out: "vismodel.js", target: "es5" }))
        .pipe(gulp.dest('build/'));
});

gulp.task('dts', function () {
    gulp.src(['src/**/*.ts'])
        .pipe(typescript({ declaration: true, out: "vismodel.d.ts", target: "es5" }))
        .pipe(gulp.dest('build/'));
});

gulp.task('min', function () {
    gulp.src('build/vismodel.js')
        .pipe(uglify('vismodel.min.js', { outSourceMap: true }))
        .pipe(gulp.dest('build/'));
});
