;(function () {
	'use strict';

	const isMobile = {
		Android: () => navigator.userAgent.match(/Android/i),
		BlackBerry: () => navigator.userAgent.match(/BlackBerry/i),
		iOS: () => navigator.userAgent.match(/iPhone|iPad|iPod/i),
		Opera: () => navigator.userAgent.match(/Opera Mini/i),
		Windows: () => navigator.userAgent.match(/IEMobile/i),
		any: function () {
			return (
				isMobile.Android() ||
				isMobile.BlackBerry() ||
				isMobile.iOS() ||
				isMobile.Opera() ||
				isMobile.Windows()
			);
		},
	};

	const mobileMenuOutsideClick = () => {
		$(document).on('click', (e) => {
			const container = $('#colorlib-offcanvas, .js-colorlib-nav-toggle');
			if (!container.is(e.target) && container.has(e.target).length === 0) {
				if ($('body').hasClass('offcanvas')) {
					$('body').removeClass('offcanvas');
					$('.js-colorlib-nav-toggle').removeClass('active');
				}
			}
		});
	};

	const offcanvasMenu = () => {
		$('#page').prepend('<div id="colorlib-offcanvas" />');
		$('#page').prepend(
			'<a href="#" class="js-colorlib-nav-toggle colorlib-nav-toggle colorlib-nav-white"><i></i></a>'
		);
		const clone1 = $('.menu-1 > ul').clone();
		const clone2 = $('.menu-2 > ul').clone();
		$('#colorlib-offcanvas').append(clone1).append(clone2);

		$('#colorlib-offcanvas .has-dropdown').addClass('offcanvas-has-dropdown');
		$('#colorlib-offcanvas')
			.find('li')
			.removeClass('has-dropdown');

		$('.offcanvas-has-dropdown')
			.on('mouseenter', function () {
				$(this).addClass('active').find('ul').stop(true, true).slideDown(500, 'easeOutExpo');
			})
			.on('mouseleave', function () {
				$(this).removeClass('active').find('ul').stop(true, true).slideUp(500, 'easeOutExpo');
			});

		// Throttle resize for better performance
		let resizeTimeout;
		$(window).on('resize', () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				if ($('body').hasClass('offcanvas')) {
					$('body').removeClass('offcanvas');
					$('.js-colorlib-nav-toggle').removeClass('active');
				}
			}, 250);
		});
	};

	const burgerMenu = () => {
		$('body').on('click', '.js-colorlib-nav-toggle', function (event) {
			const $this = $(this);
			$('body').toggleClass('overflow offcanvas');
			$this.toggleClass('active');
			event.preventDefault();
		});
	};

	const contentWayPoint = () => {
		let i = 0;
		$('.animate-box').waypoint(
			function (direction) {
				if (direction === 'down' && !$(this.element).hasClass('animated-fast')) {
					i++;
					$(this.element).addClass('item-animate');
					setTimeout(() => {
						$('.animate-box.item-animate').each((k, el) => {
							const effect = $(el).data('animate-effect');
							$(el).addClass(`${effect || 'fadeInUp'} animated-fast`).removeClass('item-animate');
						});
					}, 100);
				}
			},
			{ offset: '85%' }
		);
	};

	const dropdown = () => {
		$('.has-dropdown')
			.on('mouseenter', function () {
				$(this).find('.dropdown').stop(true, true).slideDown(200).addClass('animated-fast fadeInUpMenu');
			})
			.on('mouseleave', function () {
				$(this).find('.dropdown').stop(true, true).slideUp(200).removeClass('animated-fast fadeInUpMenu');
			});
	};

	const goToTop = () => {
		$('.js-gotop').on('click', (event) => {
			event.preventDefault();
			$('html, body').animate({ scrollTop: 0 }, 500, 'easeInOutExpo');
		});

		$(window).on('scroll', () => {
			if ($(window).scrollTop() > 200) {
				$('.js-top').addClass('active');
			} else {
				$('.js-top').removeClass('active');
			}
		});
	};

	const loaderPage = () => {
		$('.colorlib-loader').fadeOut('slow');
	};

	const sliderMain = () => {
		$('#colorlib-hero .flexslider').flexslider({
			animation: 'fade',
			slideshowSpeed: 5000,
			directionNav: true,
			start: function () {
				setTimeout(() => {
					$('.slider-text').removeClass('animated fadeInUp');
					$('.flex-active-slide').find('.slider-text').addClass('animated fadeInUp');
				}, 500);
			},
			before: function () {
				setTimeout(() => {
					$('.slider-text').removeClass('animated fadeInUp');
					$('.flex-active-slide').find('.slider-text').addClass('animated fadeInUp');
				}, 500);
			},
		});
	};

	var parallax = function() {
		if (!isMobile.any() && $.fn.stellar) { // Check if stellar function exists
			$(window).stellar({
				horizontalScrolling: false,
				hideDistantElements: false,
				responsive: true
			});
		} else {
			console.warn('Stellar.js not loaded or not supported on mobile.');
		}
	};

	$(document).ready(function(){
		$('.owl-carousel').owlCarousel({
		  items: 1,
		  loop: true,
		  margin: 10,
		  autoplay: true
		});
	});


	const datePicker = () => {
		jQuery('.date').datepicker({
			format: 'm/d/yyyy',
			autoclose: true,
		});
	};

	$(function () {
		mobileMenuOutsideClick();
		offcanvasMenu();
		burgerMenu();
		contentWayPoint();
		sliderMain();
		dropdown();
		goToTop();
		loaderPage();
		parallax();
		datePicker();
	});
})();
