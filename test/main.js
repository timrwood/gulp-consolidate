/*global describe, it*/
"use strict";

var fs = require("fs"),
	es = require("event-stream"),
	assert = require("assert"),
	gutil = require("gulp-util"),
	consolidate = require("../");

describe("gulp-consolidate", function () {

	it("should throw an error if the engine is not defined", function (done) {
		assert.throws(function () {
			consolidate();
		});
		done();
	});

	it("should throw an error if the engine is not loaded", function (done) {
		assert.throws(function () {
			consolidate("not-a-real-npm-module");
		});
		done();
	});

	it("should produce expected file via buffer", function (done) {
		var srcFile = new gutil.File({
			path: "test/fixtures/hello.txt",
			cwd: "test/",
			base: "test/fixtures",
			contents: new Buffer("Fake data")
		});

		var expectedFile = new gutil.File({
			path: "test/expected/hello.txt",
			cwd: "test/",
			base: "test/expected",
			contents: new Buffer("Hello World\n")
		});

		var stream = consolidate("swig", {
			name: "World"
		});

		stream.on("error", function (err) {
			assert(err, "errors should throw");
			done(err);
		});

		stream.on("data", function (newFile) {
			assert(newFile, "new file should exist");
			assert(newFile.contents, "new file contents should exist");

			assert.equal(String(newFile.contents), String(expectedFile.contents), "file contents should match expected contents");
			done();
		});

		stream.write(srcFile);
		stream.end();
	});

	it("should use be able to load data from a callback", function (done) {
		var srcFile = new gutil.File({
			path: "test/fixtures/filepath.txt",
			cwd: "test/",
			base: "test/fixtures",
			contents: new Buffer("Fake data")
		});

		var expectedFile = new gutil.File({
			path: "test/expected/filepath.txt",
			cwd: "test/",
			base: "test/expected",
			contents: new Buffer("Hello test/fixtures/filepath.txt\n")
		});

		var stream = consolidate("swig", function (file) {
			return {
				path: file.path
			};
		});

		stream.on("error", function (err) {
			assert(err, "errors should throw");
			done(err);
		});

		stream.on("data", function (newFile) {
			assert(newFile, "new file should exist");
			assert(newFile.contents, "new file contents should exist");

			assert.equal(String(newFile.contents), String(expectedFile.contents), "file contents should match expected contents");
			done();
		});

		stream.write(srcFile);
		stream.end();
	});

	it("should use be able to render from the file contents", function (done) {
		var srcFile = new gutil.File({
			path: "test/fixtures/hello.txt",
			cwd: "test/",
			base: "test/fixtures",
			contents: new Buffer("Fake {{name}}")
		});

		var expectedFile = new gutil.File({
			path: "test/expected/hello.txt",
			cwd: "test/",
			base: "test/expected",
			contents: new Buffer("Fake World")
		});

		var stream = consolidate("swig", {
			name: "World"
		}, { useContents : true });

		stream.on("error", function (err) {
			assert(err, "errors should throw");
			done(err);
		});

		stream.on("data", function (newFile) {
			assert(newFile, "new file should exist");
			assert(newFile.contents, "new file contents should exist");

			assert.equal(String(newFile.contents), String(expectedFile.contents), "file contents should match expected contents");
			done();
		});

		stream.write(srcFile);
		stream.end();
	});

	it("should use be able to render from the file.data property", function (done) {
		var srcFile = new gutil.File({
			path: "test/fixtures/hello.txt",
			cwd: "test/",
			base: "test/fixtures",
			contents: new Buffer("Fake {{name}}")
		});

		// add data to the file object. For testing, we're just setting it here, but in real use, use gulp-data.
		srcFile.data = {name: 'World'};

		var expectedFile = new gutil.File({
			path: "test/expected/hello.txt",
			cwd: "test/",
			base: "test/expected",
			contents: new Buffer("Fake World")
		});

		var stream = consolidate("swig", null, { useContents : true });

		stream.on("error", function (err) {
			assert(err, "errors should throw");
			done(err);
		});

		stream.on("data", function (newFile) {
			assert(newFile, "new file should exist");
			assert(newFile.contents, "new file contents should exist");

			assert.equal(String(newFile.contents), String(expectedFile.contents), "file contents should match expected contents");
			done();
		});

		stream.write(srcFile);
		stream.end();
	});

	it("should error on stream", function (done) {
		var srcFile = new gutil.File({
			path: "test/fixtures/hello.txt",
			cwd: "test/",
			base: "test/fixtures",
			contents: fs.createReadStream("test/main.js")
		});

		var stream = consolidate("swig");

		stream.on("error", function (err) {
			assert(err, "errors should throw");
			done();
		});

		stream.on("data", function (newFile) {
			newFile.contents.pipe(es.wait(function (err) {
				done(err);
			}));
		});

		stream.write(srcFile);
		stream.end();
	});
});
