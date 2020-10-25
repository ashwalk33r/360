/*
Copyright (c) 2019 "Firmowa Strona WWW" - Szymon Toda NIP 8911593279

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
$(function onDOMReady () {
	var totalFrames = 200;     // total number of frame files
	var firstFrame  = 1;       // number of first frame - in this example "FilePrefix_001.jpg"
	var reachTotalTime = 1000; // animation time of reach
	var autoplayInterval = 33; // autoplay 1 frame step time

	var requestAnimationFrame = window.requestAnimationFrame;
	var cancelAnimationFrame  = window.cancelAnimationFrame;

	var startFrame  = firstFrame;
	var currentFrame;

	var $body = $('body');
	var $productViewer360 = $('#productViewer360');
	var $frames;

	var urlImagesByFrame = [];
	var imagesDimension = { width: 0, height: 0 };

	var animationFrames = [];
	var animationInProgress = false;
	var autoplay = false;

	init();

	function init () {
		if ($productViewer360.length) {
			setUrlImagesByFrame();

			preloadImages(urlImagesByFrame, function () {
				bindProductViewer360();
				bindButtons();
				startAutoplay();
			});
		}
	}

	function bindProductViewer360 () {
		setDimensions();
		showFrame(startFrame);

		function setDimensions () {
			$productViewer360.css({
				width:  imagesDimension.width  + 'px',
				height: imagesDimension.height + 'px',
			});
		}
	}

	function bindButtons () {
		$body.on('click', '.next', function next (event) {
			autoplay = false;

			showFrameNext();

			event.preventDefault();
			return false;
		});

		$body.on('click', '.prev', function prev (event) {
			autoplay = false;

			showFramePrev();

			event.preventDefault();
			return false;
		});

		$body.on('click', '.reach', function reach (event) {
			autoplay = false;

			var frame = parseInt($(event.currentTarget).text().split(' ')[1], 10);

			reachToFrame(frame);

			event.preventDefault();
			return false;
		});
	}

	function startAutoplay () {
		autoplay = true;

		var interval = setInterval(function handler () {
			if (autoplay === false) {
				clearTimeout(interval);
			}

			showFrameNext();
		}, autoplayInterval);
	}

	function setUrlImagesByFrame () {
		var n;

		var path = './img/FilePrefix_{n}.jpg';

		for (var i = firstFrame; i <= totalFrames; i++) {
			n = '';

			if (i < 10) {
				n = '00';
			} else if (i < 100) {
				n = '0';
			}

			n = n + (i + '');

			urlImagesByFrame.push(path.replace('{n}', n));
		}
	}

	function preloadImages (images, callback) { // https://stackoverflow.com/a/11274150
		var loaded = 0;
		var i, j;

		for (i = 0, j = images.length; i < j; i++) {
			$productViewer360.append(
				$(`<img class="frame frame-${i}" />`).attr('src', urlImagesByFrame[i])
			);

			(function (img, i) {
				var src = images[i];

				img.onload = function () {
					loaded = loaded + 1;

					if (i === 0) {
						if (imagesDimension.height === 0) {
							imagesDimension.height = img.height;
						}
						
						if (imagesDimension.width === 0) {
							imagesDimension.width = img.width;
						}
					}

					if (loaded === images.length) {
						$frames = $productViewer360.find('.frame');

						if (callback) {
							callback();
						}
					}
				};

				// Use the following callback methods to debug
				// in case of an unexpected behavior.
				// img.onerror = function () {};
				// img.onabort = function () {};

				img.src = src;
			} (new Image(), i));
		}
	}

	function showFrame (targetFrame, callback) {
		if (targetFrame >= urlImagesByFrame.length) {
			targetFrame = firstFrame;
		} else if (targetFrame < firstFrame) {
			targetFrame = urlImagesByFrame.length - 1;
		}

		for (var i = 0; i < animationFrames.length; i++) {
			cancelAnimationFrame(animationFrames[i]);
		}
		animationFrames = [];

		animationFrames.push(requestAnimationFrame(function () {
			$frames.hide();
			$frames.eq(targetFrame).show();

			if (callback) {
				callback();
			}
		}));

		currentFrame = targetFrame;
	}

	function showFrameNext () {
		showFrame(currentFrame + 1);
	}

	function showFramePrev () {
		showFrame(currentFrame - 1);
	}

	function reachToFrame (targetFrame) {
		if (animationInProgress) { return; } // halt;

		animationInProgress = true;

		targetFrame = targetFrame - firstFrame;

		var steps = 0;
		var executeStack = [];

		if (currentFrame) {
			if (currentFrame > targetFrame) {
				steps = currentFrame - targetFrame;
			} else {
				steps = targetFrame - currentFrame;
			}
		}

		if (steps === 1) {
			showFrame(targetFrame);
		} else if (steps > 1) {
			var forward = targetFrame > currentFrame;
			var currentTargetFrame = currentFrame

			for (
				currentTargetFrame;
				forward ? currentTargetFrame <= targetFrame : currentTargetFrame > targetFrame;
				forward ? currentTargetFrame++ : currentTargetFrame--
			) {
				executeStack.push(currentTargetFrame);
			}

			// https://javascript.info/js-animation
			var duration = reachTotalTime;
			var timing   = graphFunctionArc;

			var start = performance.now();

			requestAnimationFrame(function animate(time) {
				// timeFraction goes from 0 to 1
				var timeFraction = (time - start) / duration;

				if (timeFraction > 1) timeFraction = 1;

				// calculate the current animation state
				var progress = timing(timeFraction)

				// draw
				var executeStackIndex = Math.floor((executeStack.length - 1) * progress);

				showFrame(executeStack[executeStackIndex]);

				if (timeFraction < 1) {
					requestAnimationFrame(animate);
				} else {
					animationInProgress = false;
				}
			});
		}
	}

	function graphFunctionArc (timeFraction) { // https://javascript.info/js-animation
		return 1 - Math.sin(Math.acos(timeFraction));
	}
});