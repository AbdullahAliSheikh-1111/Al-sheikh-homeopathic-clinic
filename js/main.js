(function ($) {
    "use strict";
    
    // Dropdown on mouse hover
    $(document).ready(function () {
        function toggleNavbarMethod() {
            if ($(window).width() > 992) {
                $('.navbar .dropdown').on('mouseover', function () {
                    $('.dropdown-toggle', this).trigger('click');
                }).on('mouseout', function () {
                    $('.dropdown-toggle', this).trigger('click').blur();
                });
            } else {
                $('.navbar .dropdown').off('mouseover').off('mouseout');
            }
        }
        toggleNavbarMethod();
        $(window).resize(toggleNavbarMethod);
    });


    // Date and time picker
    $('.date').datetimepicker({
        format: 'L'
    });
    $('.time').datetimepicker({
        format: 'LT'
    });

    $('.phone-input').on('input', function () {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 15);
    });

    $('.formspree-form').on('submit', function (event) {
        event.preventDefault();

        var form = this;
        var submitButton = $(form).find('button[type="submit"]');
        var originalButtonText = submitButton.html();
        var statusMessage = $('<div class="alert mt-3" role="alert"></div>');

        submitButton.prop('disabled', true).text('Sending...');

        fetch(form.action, {
            method: form.method,
            body: new FormData(form),
            headers: {
                Accept: 'application/json'
            }
        }).then(function (response) {
            if (!response.ok) {
                throw new Error('Submission failed');
            }

            form.reset();
            statusMessage.addClass('alert-success').text($(form).data('success-message'));
        }).catch(function () {
            statusMessage.addClass('alert-danger').text('Something went wrong. Please try again.');
        }).finally(function () {
            $(form).find('.alert').remove();
            $(form).append(statusMessage);
            submitButton.prop('disabled', false).html(originalButtonText);
        });
    });
    
    
    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 100) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });


    // Price carousel
    $(".price-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        margin: 45,
        dots: false,
        loop: true,
        nav : true,
        navText : [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
        responsive: {
            0:{
                items:1
            },
            992:{
                items:2
            },
            1200:{
                items:3
            }
        }
    });


    // Team carousel
    $(".team-carousel, .related-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        margin: 45,
        dots: false,
        loop: false,
        nav : true,
        navText : [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
        responsive: {
            0:{
                items:1
            }
        }
    });


    // Testimonials carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        items: 1,
        dots: true,
        loop: true,
    });
    
})(jQuery);

