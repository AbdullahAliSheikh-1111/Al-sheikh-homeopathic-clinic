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
        format: 'L',
        minDate: moment().add(1, 'day')
    });
    $('.time').datetimepicker({
        format: 'LT',
        stepping: 30,
        enabledHours: [17, 18, 19, 20, 21]
    });

    $('.phone-input').on('input', function () {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 15);
    });

    function resetAppointmentForm(form) {
        if (!form) {
            return;
        }

        if ($(form).find('input[name="form_type"]').val() === 'appointment') {
            $(form).find('input[name="name"], input[name="phone"], input[name="appointment_date"], input[name="appointment_time"]')
                .val('')
                .attr('autocomplete', 'new-password');
            return;
        }

        form.reset();
    }

    function showFormStatus(form, statusMessage) {
        $(form).find('.alert').remove();
        $(form).append(statusMessage);
        setTimeout(function () {
            statusMessage.stop(true, true).fadeOut(300, function () {
                $(this).remove();
            });
        }, 5000);
    }

    $('.formspree-form').on('submit', function (event) {
        event.preventDefault();

        var form = this;
        var submitButton = $(form).find('button[type="submit"]');
        var originalButtonText = submitButton.html();
        var statusMessage = $('<div class="alert mt-3" role="alert"></div>');
        var formType = $(form).find('input[name="form_type"]').val();
        var appointmentDateInput = $(form).find('input[name="appointment_date"]');
        var appointmentTimeInput = $(form).find('input[name="appointment_time"]');

        if (appointmentDateInput.length) {
            var selectedDate = appointmentDateInput.val();
            var parsedSelectedDate = moment(selectedDate, ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true);
            if (!parsedSelectedDate.isValid() || !parsedSelectedDate.isAfter(moment().startOf('day'))) {
                statusMessage.addClass('alert-warning').text('Appointments can only be booked for a future date. Please choose a date after today.');
                showFormStatus(form, statusMessage);
                submitButton.prop('disabled', false).html(originalButtonText);
                return;
            }
        }

        if (appointmentTimeInput.length) {
            var selectedTime = appointmentTimeInput.val();
            if (selectedTime) {
                var parsedSelectedTime = moment(selectedTime, ['h:mm A', 'hh:mm A', 'H:mm', 'HH:mm'], true);
                if (!parsedSelectedTime.isValid()) {
                    statusMessage.addClass('alert-warning').text('Please select a valid appointment time between 5:00 PM and 9:30 PM.');
                    showFormStatus(form, statusMessage);
                    submitButton.prop('disabled', false).html(originalButtonText);
                    return;
                }

                var startAllowed = moment('17:00', 'HH:mm');
                var endAllowed = moment('21:30', 'HH:mm');
                var timeMinutes = parsedSelectedTime.hours() * 60 + parsedSelectedTime.minutes();
                var startMinutes = startAllowed.hours() * 60 + startAllowed.minutes();
                var endMinutes = endAllowed.hours() * 60 + endAllowed.minutes();

                if (timeMinutes < startMinutes || timeMinutes > endMinutes) {
                    statusMessage.addClass('alert-warning').text('Appointments are only available between 5:00 PM and 9:30 PM.');
                    showFormStatus(form, statusMessage);
                    submitButton.prop('disabled', false).html(originalButtonText);
                    return;
                }
            }
        }

        var client = window.supabaseClient || null;
        if (!client || !client.auth || !client.auth.getSession) {
            statusMessage.addClass('alert-warning').text('Please log in first to continue.');
            showFormStatus(form, statusMessage);
            return;
        }

        submitButton.prop('disabled', true).text('Checking login...');

        client.auth.getSession().then(function (result) {
            if (!result.data.session) {
                var loginMessage = formType === 'appointment'
                    ? 'Please log in first to book an appointment.'
                    : 'Please log in first to send this message.';
                statusMessage.addClass('alert-warning').text(loginMessage);
                showFormStatus(form, statusMessage);
                submitButton.prop('disabled', false).html(originalButtonText);
                return;
            }

            var user = result.data.session.user;
            var patientAccountName = (user.user_metadata && user.user_metadata.full_name) || user.email || 'Patient';
            var patientAccountEmail = user.email || '';

            var accountNameInput = $(form).find('input[name="patient_account_name"]');
            var accountEmailInput = $(form).find('input[name="patient_account_email"]');
            var emailInput = $(form).find('input[name="email"]');
            var appointmentNameInput = $(form).find('input[name="name"]');

            if (accountNameInput.length) {
                accountNameInput.val(patientAccountName);
            }
            if (accountEmailInput.length) {
                accountEmailInput.val(patientAccountEmail);
            }
            if (emailInput.length && patientAccountEmail) {
                emailInput.val(patientAccountEmail);
            }

            var formData = new FormData(form);
            formData.set('patient_account_name', patientAccountName);
            formData.set('patient_account_email', patientAccountEmail);
            if (patientAccountEmail) {
                formData.set('email', patientAccountEmail);
            }

            var appointmentName = appointmentNameInput.length ? appointmentNameInput.val().trim() : '';
            if (appointmentName) {
                formData.set('name', appointmentName);
            }

            console.log('Appointment FormData before submit:', Array.from(formData.entries()));

            submitButton.text('Sending...');

            return fetch(form.action, {
                method: form.method,
                body: formData,
                headers: {
                    Accept: 'application/json'
                }
            }).then(function (response) {
                if (!response.ok) {
                    throw new Error('Submission failed');
                }

                resetAppointmentForm(form);
                statusMessage.addClass('alert-success').text($(form).data('success-message'));
            }).catch(function () {
                statusMessage.addClass('alert-danger').text('Something went wrong. Please try again.');
            }).finally(function () {
                showFormStatus(form, statusMessage);
                submitButton.prop('disabled', false).html(originalButtonText);
            });
        }).catch(function () {
            statusMessage.addClass('alert-warning').text('Please log in first to continue.');
            showFormStatus(form, statusMessage);
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

