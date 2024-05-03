/**
 * Create and add a Potree annotation to the scene with the provided information.
 *
 * @param {number} id - Unique identifier for the annotation.
 * @param {object} scene - The Potree scene in which the annotation will be added.
 * @param {string} titleText - Text for the title of the annotation.
 * @param {number[]} position - Array containing x, y, z coordinates of the annotation position.
 * @param {number[]} cameraPosition - Array containing x, y, z coordinates of the camera position.
 * @param {number[]} cameraTarget - Array containing x, y, z coordinates of the camera target.
 * @param {string} descriptionText - Text for the description of the annotation.
 * @throws {Error} Will throw an error if there's an issue creating or adding the annotation to the scene.
 */
function createAnnotation(
    id,
    scene,
    titleText,
    position,
    cameraPosition,
    cameraTarget,
    descriptionText
  ) {
    // Create title and description elements
    let titleElement = $(`<span>${titleText}</span>`);
    // Create Potree.Annotation instance
    let annotation = new Potree.Annotation({
      position: position,
      title: titleElement,
      cameraPosition: cameraPosition,
      cameraTarget: cameraTarget,
      description: descriptionText,
    });
    // Assigning unique ID from database
    annotation.customId = id;
    // Set the annotation to be visible
    annotation.visible = true;
    // Add the annotation to the scene
    scene.annotations.add(annotation);
    // Override toString method for the title element
    titleElement.toString = () => titleText;
};

function toggleGraphPanel() {
  // Get the graph panel element
  var graphPanel = document.getElementById("graphPanel");

  // Check the current display style
  var currentDisplayStyle = window.getComputedStyle(graphPanel).display;

  // Toggle the display style based on the current state
  if (currentDisplayStyle === "flex") {
    // If it's currently visible, hide it
    graphPanel.style.display = "none";
  } else {
    // If it's currently hidden, show it
    graphPanel.style.display = "flex";
  }
}

// Attach toggleGraphPanel function to the button click event
document.getElementById("closeGraph").addEventListener("click", toggleGraphPanel);

