$(document).ready(function () {
    function openForm() {
        document.getElementById("myForm").style.display = "block";
    }

    function closeForm() {
        document.getElementById("myForm").style.display = "none";
    }

    // jQuery function that only allows numbers in the input field
    // (function ($) {
    //     $.fn.inputFilter = function (inputFilter) {
    //         return this.on("input keydown keyup mousedown mouseup select contextmenu drop", function () {
    //             if (inputFilter(this.value)) {
    //                 this.oldValue = this.value;
    //                 this.oldSelectionStart = this.selectionStart;
    //                 this.oldSelectionEnd = this.selectionEnd;
    //             } else if (this.hasOwnProperty("oldValue")) {
    //                 this.value = this.oldValue;
    //                 this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
    //             }
    //         });
    //     };
    // }(jQuery));
    // // Calling the jQuery function that filters the input to numbers only and assigns it to the zip code input field
    // $("#zip").inputFilter(function (value) {
    //     return /^-?\d*$/.test(value);
    // });


    // jQuery function that only allows numbers in the input field
    (function ($) {
        $.fn.inputFilter = function (inputFilter) {
            return this.on("input keydown keyup mousedown mouseup select contextmenu drop", function () {
                if (inputFilter(this.value)) {
                    this.oldValue = this.value;
                    this.oldSelectionStart = this.selectionStart;
                    this.oldSelectionEnd = this.selectionEnd;
                } else if (this.hasOwnProperty("oldValue")) {
                    this.value = this.oldValue;
                    this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
                }
            });
        };
    }(jQuery));

    // Calling the jQuery function that filters the input to numbers only and assigns it to the zip code input field
    $("#zip").inputFilter(function (value) {
        return /^-?\d*$/.test(value);
    });

    var specialtyInput, symptomInput, zipInput;
    //on load, hide the content
    $("#results").hide();
    $(".footer").hide()
    $("#need-zip").hide()
    $("#no-doctors-error").hide();

    $("#submit").on("click", function (event) {

        var markers = [];
        var infoWindows = [];

        //clear the table
        $("#table-body tr").remove();
        //get the user input
        event.preventDefault();
        specialtyInput = $("#specialty").val();
        specialtyInput = specialtyInput.toLowerCase();
        console.log("Specialty: " + specialtyInput);
        symptomInput = $("#symptoms").val();
        console.log("Symptoms: " + symptomInput);
        zipInput = $("#zip").val();
        console.log("Zip code: " + zipInput)
        if (zipInput === '' || zipInput < 10001) {
            $("#results").hide();
            $(".footer").hide();
            $("#need-zip").show(1000);
            $("#no-doctors-error").hide(1000);
            $("#zip").addClass('form-error');
            return;
        } else {
            $("#results").show();
            $(".footer").show();
            $("#need-zip").hide(1000);
            $("#no-doctors-error").hide(1000);
            $("#zip").removeClass('form-error');
            //translate the zip code input into longitude and latitude
            var lat = '';
            var lng = '';
            var address = zipInput;
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({
                'address': address
            }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    console.log(results);
                    lat = results[0].geometry.location.lat();
                    console.log(lat);
                    lng = results[0].geometry.location.lng();
                    console.log(lng);
                } else {
                    $("#results").hide();
                    $(".footer").hide();
                    $("#no-doctors-error").show(1000);
                    $("#zip").removeClass('form-error');
                }
                var docapikey = "3d8e6119d3a6fd86b2f6414e6f6ade72";
                var resource_url = 'https://api.betterdoctor.com/2016-03-01/doctors?query=' + symptomInput + "&specialty_uid=" + specialtyInput + "&location=" + lat + "%2c" + lng + "%2c5" + '&user_key=' + docapikey;
                console.log(resource_url)
                var map;
                console.log('google', google);

                function initMap() {
                    map = new google.maps.Map(document.getElementById('map'), {
                        center: {
                            lat: lat,
                            lng: lng
                        },
                        zoom: 10
                    });
                }
                initMap()
                //get the response
                $.ajax({
                    url: resource_url,
                    method: "GET"
                }).then(function (response) {
                        console.log(response)
                        for (var i = 0; i < 11; i++) {
                            //new table rows
                            var newTr = $("<tr>").attr("id", "search-results");
                            var newTd = $("<td>");
                            var newTd1 = $("<img>");
                            var newTd2 = $("<td>");
                            var newTd3 = $("<td>");
                            var newTd4 = $("<td>");
                            var newTd5 = $("<td>");
                            var newTd6 = $("<img>");

                            //new variables for doctor office locations

                            var myLatLng = {
                                lat: response.data[i].practices[0].lat,
                                lng: response.data[i].practices[0].lon
                            }

                            newTd.text(i + 1)
                            newTd1.attr("src", response.data[i].profile.image_url);
                            newTd2.text(response.data[i].profile.first_name + " " + response.data[i].profile.last_name);
                            newTd3.text(response.data[i].specialties[0].name);
                            newTd4.text(response.data[i].practices[0].visit_address.city);
                            var newPatients = response.data[i].practices[0].accepts_new_patients;

                            if (newPatients === true) {
                                newTd5.text("Yes");
                            } else {
                                newTd5.text("No");
                            }

                            if (response.data[i].ratings.length > 0) {
                                newTd6 = $("<img>");
                                newTd6.attr("src", response.data[i].ratings[0].image_url_small);
                            } else {
                                newTd6 = $("<td>");
                                newTd6.text("N/A");
                            }
                            //Append table data to table rows
                            newTr.append(newTd, newTd1, newTd2, newTd3, newTd4, newTd5, newTd6);
                            //Append table row to the table body
                            var tableBody = $("#table-body")
                            //append my new row to the table body
                            tableBody.append(newTr)
                            newTd1.attr("alt", response.data[i].profile.bio);
                            newTd1.attr("title", response.data[i].profile.bio);




                            //add markers to the map
                            markers[i] = new google.maps.Marker({
                                position: myLatLng,
                                map: map,
                                title: response.data[i].profile.first_name + " " + response.data[i].profile.last_name + " " + response.data[i].specialties[0].name,
                                id: i,
                                label: (i + 1).toString()

                            });
                            infowindow = new google.maps.InfoWindow({
                                // content: response.data[i].profile.first_name + " " + response.data[i].profile.last_name,
                                content: contentString
                            });
                            var contentString = response.data[i].profile.first_name + " " + response.data[i].profile.last_name

                            google.maps.event.addListener(markers[i], 'click', function () {

                                infowindow.open(map, markers[i])
                            });

                            // console.log(markers)
                        }




                    }


                )
            });




        }
    })


});