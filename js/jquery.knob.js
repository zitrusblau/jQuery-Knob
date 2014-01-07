// IE8 logging fallback
var console=console||{"log":function(){}};

// Interface <<Closest>>
function Closest(user_value) {
    
    var key;
    var index;
    var element;
    var upper = {};
    var lower = {};
    var autarchy_limit = {};

    this.key = user_value;

    this.init = function() {
        // Nothin
        upper.val;
        upper.index;
        lower.val;
        lower.index;
        autarchy_limit.min;
        autarchy_limit.max;
    }

    this.init();

    this.setKey = function(newKey) {
        this.key = newKey;
    };

    this.getKey = function() {
        return this.key;
    };

    this.setIndex = function(newIndex) {
        this.index = newIndex;
    };

    this.getIndex = function() {
        return this.index;
    };

    this.setElement = function(newElement) {
        this.element = newElement;
    };

    this.getElement = function() {
        return this.element;
    };

    this.setUpper = function(newUpper, index) {
        upper.val = newUpper;
        upper.index = index;
    };

    this.getUpper = function() {
        return upper;
    };

    this.setLower = function(newLower, index) {
        lower.val = newLower;
        lower.index = index;
    };

    this.getLower = function() {
        return lower;
    };
    
    this.setAutarchyLimit = function(newMin, newMax) {
        autarchy_limit.min = newMin;
        autarchy_limit.max = newMax;
    };

    this.getAutarchyLimit = function() {
        return autarchy_limit;
    };


};

jQuery(document).ready(function ($) {

    function interpolateResult(cl_obj, consumption, capacity, autarchy_user_value) {
        // Formula: Y-Wert=Y,unten +(Y,oben-Y,unten)/(A,oben -A,unten)*(A,0,4-A,unten)
        // passed json data object: calc_data ; result step width: 0.132
        var result = 0,
            autarchy_index = Math.round((capacity / consumption)*10)/10; // round values with one digit, ie. 0.8

        // 0.5 < index < 3 ?

        // set upper limit
        if(autarchy_index > 3) autarchy_index = 3;
        if(!(autarchy_index >= 0.5) || !(autarchy_index <= 3)) {

            console.log("Index for autarchy array out of bounds!");

            return false;
        }
        
        cl_obj.setAutarchyLimit(Math.round(calc_data.autarchy_values[autarchy_index][0]*100)/100,
                                Math.round(calc_data.autarchy_values[autarchy_index][calc_data.autarchy_values[autarchy_index].length-1]*100)/100
                                );

        var autarchy_limit = cl_obj.getAutarchyLimit();

        // Too low?
        if(autarchy_user_value < autarchy_limit.min) {
            console.log("INTERPOLATION: User value " + autarchy_user_value + " too low. Alternating to minimum " + autarchy_limit.min);
            autarchy_user_value = autarchy_limit.min;
            cl_obj.setKey(autarchy_user_value);
        }

        // Too high?
        if(autarchy_user_value >  autarchy_limit.max) {
            console.log("INTERPOLATION: User value " + autarchy_user_value + " too high. Alternating to maximum " + autarchy_limit.max);
            autarchy_user_value = autarchy_limit.max;
            cl_obj.setKey(autarchy_user_value);
        }


        // find the limits
        getClosestElements(cl_obj, calc_data.autarchy_values[autarchy_index]);

        var a = {
                key   : cl_obj.getKey(),
                upper : cl_obj.getUpper(),
                lower : cl_obj.getLower()
            },
            y = {
                upper : calc_data.interpolation_values[a.upper.index],
                lower : calc_data.interpolation_values[a.lower.index]
            };

        // calculate interpolated result
        if(a.upper.val != a.lower.val) {
            result = y.lower + (y.upper - y.lower) / (a.upper.val - a.lower.val) * (a.key - a.lower.val);
            
        } else {
            // Upper val equals lower value
            result = y.lower;
        }    

        result = Math.round(result * 100) / 100 * (consumption / 1000);

        if(result != 0) {
            result = result.toFixed(2);
        }

        return result;
     }

    /*
     * FILTER FUNCTIONS
     */
    function prepareClosest(cl_obj, autarchy_values) {

        // find closest element in array

        var key = cl_obj.getKey(),
            prev = Math.abs(autarchy_values[0] - key);

        cl_obj.setIndex(0);
        cl_obj.setElement(autarchy_values[cl_obj.getIndex()]);

        // Iterate    
        $.each(autarchy_values, function(i) {
            var diff = Math.abs(autarchy_values[i] - key);

            if (diff < prev) {
                prev = diff;
                cl_obj.setElement(autarchy_values[i]);
                cl_obj.setIndex(i);
            }
        });

    }

    function finalizeClosest(cl_obj, autarchy_values) {

        // find lower and upper limits for given key

        var key = cl_obj.getKey(),
            index = cl_obj.getIndex(),
            element = cl_obj.getElement();

        if (autarchy_values[index] < key && index < autarchy_values.length-1) {  // value is lower than key...
            cl_obj.setLower(element, index);
            cl_obj.setUpper(autarchy_values[index+1], index+1);
            //console.log('value is lower than key...');
        }
        else if(autarchy_values[index] < key && index == autarchy_values.length-1) { // value is lower and last element in the array...
            cl_obj.setLower(element, index);
            cl_obj.setUpper(element, index);
            //console.log('value is lower than key and last element');
        }
        else if (autarchy_values[index] > key && index == 0) {  // value is higher and first element in the array...
            cl_obj.setLower(element, index);
            cl_obj.setUpper(element, index);
            //console.log('value is higher than key and first element...');
        }
        else if (autarchy_values[index] > key) {  // if found value is greater than key...
            cl_obj.setLower(autarchy_values[index-1], index-1);
            cl_obj.setUpper(element, index);
            //console.log('value is higher than key...');
        } else {

            console.log("EXCEPTION!");

        }

    }

    function getClosestElements(cl_obj, autarchy_values) {

        // 1. Preparation
        prepareClosest(cl_obj, autarchy_values);

         // 2. Completion
        finalizeClosest(cl_obj, autarchy_values);
       
    }

    var cl_obj,
        consumption = $(".knob.consumption").val(),
        capacity = $(".knob.capacity").val(),
        autarchy = $(".knob.autarchy").val() / 100,
        autarchy_limit,
        result,
        newVal = null,
        oldVal = null,
        newMin,
        newMax,
        newOffset,
        newArc;

    // ############ Event Handling ##########            

    // wrap this into onload event, to display canvas elements in IE8 initially
    window.onload = function() {
        $(".knob").knob({
            change : function (value) {

                newVal = this._validate(value);
                
                if(newVal != oldVal) {
                    //console.log("change: " + value);
                    this.$.attr('aria-valuenow', newVal);

                    if( this.$.hasClass('consumption') ) {
                        consumption = newVal;
                        capacity = $(".knob.capacity").val();
                        autarchy = $(".knob.autarchy").val() / 100;
                    }
                    else if( this.$.hasClass('capacity') ) {
                        consumption = $(".knob.consumption").val();
                        capacity = newVal;
                        autarchy = $(".knob.autarchy").val() / 100;
                    }
                    else if( this.$.hasClass('autarchy') ) {
                        consumption = $(".knob.consumption").val();
                        capacity = $(".knob.capacity").val();
                        autarchy = newVal / 100;
                    }
                    
                    // Init object
                    cl_obj = new Closest(autarchy);

                    // Calculate limits
                    autarchy_limit = cl_obj.getAutarchyLimit();        

                    result = interpolateResult(cl_obj, consumption, capacity, autarchy);

                    // Deal with minimal viable result
                    if(result < 1) {
                        // Alternate value
                        result = 1;

                        // Alternate style
                    }

                    // Check limits

                    // => Too low?
                    if(autarchy < autarchy_limit.min) {
                        console.log("EVENT HANDLER: User value " + autarchy + " too low. Alternating to minimum " + autarchy_limit.min);
                        autarchy = autarchy_limit.min;                    
                        cl_obj.setKey(autarchy);
                    }

                    // => Too high?
                    if(autarchy > autarchy_limit.max) {
                        console.log("EVENT HANDLER: User value " + autarchy + " too high. Alternating to maximum " + autarchy_limit.max);
                        autarchy = autarchy_limit.max;
                        cl_obj.setKey(autarchy);
                    }                 

                    if(result === false) {
                        console.log("EXCEPTION! Result (" + result + ") invalid.");
                        console.log(cl_obj);
                    }

                    if( this.$.hasClass('consumption') ) {
                        
                        $newMaxCapacity = Math.round((consumption * 3) / 100) * 100;

                        $(".knob.capacity").trigger('configure', {
                            'max':$newMaxCapacity
                        }).attr('aria-valuemax', $newMaxCapacity);
                        if(capacity > $newMaxCapacity) {
                            $(".knob.capacity").val($newMaxCapacity).attr('aria-valuenow', $newMaxCapacity).trigger('change');
                        }

                        $("#capacity-stop").text(($newMaxCapacity/1000).toFixed(3));

                    }

                    if( this.$.hasClass('consumption') || this.$.hasClass('capacity') ) {

                        $newMin     = parseInt((autarchy_limit.min * 100).toFixed(0));  // workaround to prevent floating point rounding errors
                        $newMax     = parseInt((autarchy_limit.max * 100).toFixed(0));  // see http://stackoverflow.com/questions/588004/is-javascripts-floating-point-math-broken
                        $newOffset  = 360 * ($newMin/100);
                        $newArc     = 360 * ($newMax/100) - $newOffset;

                        $(".knob.autarchy").val(parseInt(autarchy * 100)).attr('aria-valuenow', parseInt(autarchy * 100)).trigger('change').trigger('configure', {
                            'angleOffset':$newOffset,
                            'angleArc':$newArc,
                            'min':$newMin,
                            'max':$newMax
                        }).attr('aria-valuemin', $newMin).attr('aria-valuemax', $newMax);

                        $("#autarchy-start").text($newMin);
                        $("#autarchy-stop").text($newMax);

                    }

                    // display the result
                    $(".knob.total").val(result);

                    oldVal = newVal;
                }
            },
            release : function (value) {
                //console.log("release: " + value);
            },
            cancel : function () {
                
            },
            draw : function () {

                // "tron" case
                if(this.$.data('skin') == 'tron') {

                    var a = this.angle(this.cv)  // Angle
                        , sa = this.startAngle          // Previous start angle
                        , sat = this.startAngle         // Start angle
                        , ea                            // Previous end angle
                        , eat = sat + a                 // End angle
                        , r = 1;

                    this.g.lineWidth = this.lineWidth;

                    this.o.cursor
                        && (sat = eat - 0.3)
                        && (eat = eat + 0.3);

                    if (this.o.displayPrevious) {
                        ea = this.startAngle + this.angle(this.v);
                        this.o.cursor
                            && (sa = ea - 0.3)
                            && (ea = ea + 0.3);
                        this.g.beginPath();
                        this.g.strokeStyle = this.pColor;
                        this.g.arc(this.xy, this.xy, this.radius - this.lineWidth, sa, ea, false);
                        this.g.stroke();
                    }

                    this.g.beginPath();
                    this.g.strokeStyle = r ? this.o.fgColor : this.fgColor ;
                    this.g.arc(this.xy, this.xy, this.radius - this.lineWidth, sat, eat, false);
                    this.g.stroke();

                    this.g.lineWidth = 2;
                    this.g.beginPath();
                    this.g.strokeStyle = this.o.fgColor;
                    this.g.arc( this.xy, this.xy, this.radius - this.lineWidth + 1 + this.lineWidth * 2 / 3, 0, 2 * Math.PI, false);
                    this.g.stroke();

                    return false;
                }
            }
        });
        
        // ############ Init ##########

        cl_obj = new Closest(autarchy);
        result = interpolateResult(cl_obj, consumption, capacity, autarchy);

        autarchy_limit = cl_obj.getAutarchyLimit();

        newMin     = parseInt((autarchy_limit.min * 100).toFixed(0));  // workaround to prevent floating point rounding errors
        newMax     = parseInt((autarchy_limit.max * 100).toFixed(0));  // see http://stackoverflow.com/questions/588004/is-javascripts-floating-point-math-broken
        newOffset  = 360 * (newMin/100);
        newArc     = 360 * (newMax/100) - newOffset;

        $("#autarchy-start").text(newMin);
        $("#autarchy-stop").text(newMax);

        $(".knob.total").val(result).trigger('change');

        $(".knob.autarchy").val(parseInt(autarchy * 100)).attr('aria-valuenow', parseInt(autarchy * 100)).trigger('change').trigger('configure', {
            'angleOffset':newOffset,
            'angleArc':newArc,
            'min':newMin,
            'max':newMax
        }).attr('aria-valuemin', newMin).attr('aria-valuemax', newMax);

    }

});
