let src;
let dst;
let loaded = false;
let thresholdValue;
let refArea = 0;

// JavaScript to update the value display
const slider = document.getElementById("slider");
const sliderValue = document.getElementById("slider-value");

//slider listner

slider.addEventListener("input", () => {
    sliderValue.textContent = slider.value;
    thresholdValue = parseInt(slider.value, 10);
    processImage(thresholdValue, refArea);
});

// Callback when OpenCV.js is ready
function onOpenCvReady() {
    // Initialize OpenCV.js
    cv.onRuntimeInitialized = function () {
        loaded = true;
    };
}

//when process button is pressed
function buttonPressed(slider) {
    getReference(slider) ;
}


// Function to handle image processing
function processImage(slider, refArea) {

    if (!loaded) {
        console.error('OpenCV.js is not loaded yet.');
        return;
    }
    // Get the input file element
    const fileInput = document.getElementById('fileInput');

    // Check if a file is selected
    if (fileInput.files.length === 0) {
        console.error('No image selected.');
        return;
    }

    // Get the selected file
    const file = fileInput.files[0];

    // Create an HTMLImageElement to display the selected image
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = function () {
        // Get the canvas element
        const canvas = document.getElementById('canvas');

        // Set canvas dimensions to match the image
        canvas.width = 500;
        canvas.height = 500;

        // Get the 2D drawing context of the canvas
        const ctx = canvas.getContext('2d');

        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0, 500, 500);

        // Load the image from the canvas using OpenCV.js
        src = cv.imread(canvas);
        let src2 = src.clone();
        let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
        cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
        cv.threshold(src, src, slider, 255, cv.THRESH_BINARY);
        cv.bitwise_not(src, src)

        let contours = new cv.MatVector();
        let contours2 = new cv.MatVector();
        let hierarchy = new cv.Mat();

        cv.findContours(src, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_NONE);
    
        let color = new cv.Scalar(0, 0, 225);
        
        // finding largest and second largest contours
        let largestContour; let secondLargestContour ;
        if (contours.size() >= 2) {
             largestContour = contours.get(0);
             secondLargestContour = contours.get(1);

            for (let i = 2; i < contours.size(); i++) {
                let currentContour = contours.get(i);

                if (cv.contourArea(currentContour) > cv.contourArea(largestContour)) {
                    secondLargestContour = largestContour;
                    largestContour = currentContour;
                    
                } else if (cv.contourArea(currentContour) > cv.contourArea(secondLargestContour)) {
                    secondLargestContour = currentContour;
                }
            }

            contours2.push_back(largestContour);
            cv.drawContours(src2, contours2, -1, color, 2);
            let areaScaleFactor = 4 /refArea ;

            // Area text for the Largest contour

            let area = cv.contourArea(largestContour) * areaScaleFactor;
            let boundingRect = cv.boundingRect(largestContour);
            let text = 'Area: ' + area + ' cm2';

            let x = boundingRect.x;
            let y = boundingRect.y;

            let position = new cv.Point(x, y); // (x, y) coordinates of the text position
            let fontFace = cv.FONT_HERSHEY_SIMPLEX;
            let fontScale = 0.6;
            let color2 = new cv.Scalar(0, 0, 255); // BGR color (red in this case)
            let thickness = 1;
            
            cv.putText(src2, text, position, fontFace, fontScale, color2, thickness);

                
        } else {
            console.error('There are not enough contours to find the largest and second largest.');
        }

        cv.imshow(canvas, src2);
        src.delete(); dst.delete(); contours.delete(); hierarchy.delete(); src2.delete();

    };
}



function getReference(slider) {
    refArea = 0;
    let count = 0;
    if (!loaded) {
        console.error('OpenCV.js is not loaded yet.');
        return;
    }
    // Get the input file element
    const fileInput = document.getElementById('fileInput');

    // Check if a file is selected
    if (fileInput.files.length === 0) {
        console.error('No image selected.');
        return;
    }

    // Get the selected file
    const file = fileInput.files[0];

    // Create an HTMLImageElement to display the selected image
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = function () {
        // Get the canvas element
        const canvas = document.getElementById('canvas');
    
        // Set canvas dimensions to match the image
        canvas.width = 500;
        canvas.height = 500;
    
    
        // Get the 2D drawing context of the canvas
        const ctx = canvas.getContext('2d');
    
    
        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0, 500, 500);

        // Load the image from the canvas using OpenCV.js
        src = cv.imread(canvas);
        let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
        cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);

        cv.threshold(src, src, 100, 255, cv.THRESH_BINARY);
        cv.bitwise_not(src, src)
        let contours = new cv.MatVector();
        let contours2 = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(src, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_NONE);
        
        let color = new cv.Scalar(0, 225, 225);
        
        // finding largest and second largest contours
        let largestContour; let secondLargestContour ;
        let numEdges;

        if (contours.size() >= 2) {
                largestContour = contours.get(0);
                secondLargestContour = contours.get(1);

            for (let i = 2; i < contours.size(); i++) {
                let currentContour = contours.get(i);

                if (cv.contourArea(currentContour) > cv.contourArea(largestContour)) {
                    secondLargestContour = largestContour;
                    largestContour = currentContour;
                    
                } else if (cv.contourArea(currentContour) > cv.contourArea(secondLargestContour)) {
                    secondLargestContour = currentContour;
                }
            }

            contours2.push_back(secondLargestContour);

            // counting the number of edges
            let epsilon = 0.02 * cv.arcLength(secondLargestContour, true);
            let approx = new cv.Mat();
            cv.approxPolyDP(secondLargestContour, approx, epsilon, true);

            // Count the number of vertices in the polygon
            numEdges = approx.rows;
            
            if (numEdges == 4 && !isNaN(cv.contourArea(secondLargestContour))) {
            
                refArea = refArea +cv.contourArea(secondLargestContour);
                count = count + 1;
            }


        } else {
            console.log("contours are low ");
        }           

        
        refArea = refArea/count
        console.log("refArea: " + refArea + ' : count: ' + count);
        
        processImage(slider, refArea);
    
    }    
}






    

    


