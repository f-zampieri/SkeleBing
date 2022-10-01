let isImageLoaded = false;
let canvas;
const imageOffsetX = 200;
const imageOffsetY = 150;
let context;
let currentSprite;
let sprites = [];
let frameData = [];
let currentFrameIndex = 0;
let image;
let selectedTool;
/*
 * https://en.wikipedia.org/wiki/Graph_theory
 * skeleton is a graph where vertices are joints and arcs are bones
 */
let currentSkeleton = {
	"hitboxes": {},
	"joints": {}
};
let toolNameToMouseDownHandlerMap;

/*
 * begin hitboxes
 */
function handleHitboxToolMouseDown(event, mousePosition) {
	if (isImageLoaded) {
		const denormalizedMousePosition = {
			x: mousePosition.x,
			y: mousePosition.y
		};
		let addHitboxSuccess = addHitbox(denormalizedMousePosition);
		if (addHitboxSuccess) {
			drawHitboxCrosshairs(mousePosition, Object.keys(currentSkeleton.hitboxes).length);
		}
	}
}

function moveHitbox(xDiff, yDiff) {
	let hitboxIndex = parseInt(document.getElementById('hitbox-adjust-select').value, 10);
	if (!isNaN(hitboxIndex)) {
		let hitbox = currentSkeleton.hitboxes[hitboxIndex];
		hitbox.position.x += xDiff;
		hitbox.position.y += yDiff;
		// TODO - need dis?
		renderBasedOnToggleBones();
		updateHitboxListEntry(hitboxIndex);
	}
}

function moveHitboxUp() {
	moveHitbox(0, -1);
}

function moveHitboxRight() {
	moveHitbox(1, 0);
}

function moveHitboxDown() {
	moveHitbox(0, 1);
}

function moveHitboxLeft() {
	moveHitbox(-1, 0);
}

function updateHitboxSelectElements() {
	let defaultOptionElementHtml = '<option value=\"---\">---</option>';
	let hitboxIndices = Object.keys(currentSkeleton.hitboxes)
	let selectElements = document
		.getElementsByTagName('select');
	let hitboxSelectElements = [];
	for (let selectElement of selectElements) {
		if (selectElement.id.startsWith('hitbox')) {
			hitboxSelectElements.push(selectElement);
		}
	}
	hitboxSelectElements.forEach(selectElement => {
		selectElement.innerHTML = defaultOptionElementHtml;
		hitboxIndices
			.map(function(hitboxIndex) {
				let optionElement = document.createElement('option');
				optionElement.value = hitboxIndex;
				optionElement.innerText = hitboxIndex;
				return optionElement;
			})
			.forEach(function(optionElement) {
				selectElement.appendChild(optionElement);
			});
	});
}

function addHitbox(position) {
	const hitboxRadiusInput = document.getElementById("hitbox-parameter-radius");
	const hitboxRadius = hitboxRadiusInput.value;
	const hitboxAngleInput = document.getElementById("hitbox-parameter-angle");
	const hitboxAngle = hitboxAngleInput.value;
	if (hitboxRadius.length === 0 || isNaN(parseFloat(hitboxRadius))
		|| hitboxAngle.length === 0 || isNaN(parseFloat(hitboxAngle))) {
		return false;
	}
	let hitboxIndex = Object.keys(currentSkeleton.hitboxes).length + 1;
	currentSkeleton.hitboxes[hitboxIndex] = {
		position: position,
		radius: hitboxRadius,
		angle: hitboxAngle
	};
	let hitboxesList = document.getElementById('hitboxes-list');
	let newListItem = document.createElement('li');
	newListItem.innerText = generateHitboxListItemInnerText(currentSkeleton.hitboxes[hitboxIndex]);
	hitboxesList.appendChild(newListItem);
	updateHitboxSelectElements();
	return true;
}

function drawAllHitboxes() {
	Object.entries(currentSkeleton.hitboxes).forEach(entry => {
		drawHitboxCrosshairs(entry[1].position, entry[0])
	});
}

function generateHitboxListItemInnerText(hitbox) {
	const xPosition = hitbox.position.x - imageOffsetX;
	const yPosition = hitbox.position.y - imageOffsetY;
	return `(${xPosition}, ${yPosition})`;
}

function updateHitboxListEntry(hitboxListIndex) {
	let hitboxesList = document.getElementById('hitboxes-list');
	let hitbox = currentSkeleton.hitboxes[hitboxListIndex];
	hitboxesList.childNodes[hitboxListIndex - 1].innerText = generateHitboxListItemInnerText(hitbox);
}

function updateAllHitboxListEntries() {
	let hitboxesList = document.getElementById('hitboxes-list');
	hitboxesList.innerHTML = '';
	for (let key of Object.keys(currentSkeleton.hitboxes)) {
		let listItemElement = document.createElement('li');
		listItemElement.innerText = generateHitboxListItemInnerText(currentSkeleton.hitboxes[key]);
		hitboxesList.appendChild(listItemElement);
	}
}
/*
 * end hitboxes
 */

/*
 * begin joints
 */
function handleJointToolMouseDown(event, mousePosition) {
	if (isImageLoaded && !document.getElementById("bone-toggle").checked) {
		const denormalizedMousePosition = {
			x: mousePosition.x,
			y: mousePosition.y
		};
		addJoint(denormalizedMousePosition);
		drawJointCrosshairs(mousePosition, Object.keys(currentSkeleton.joints).length);
	}
}

function moveJoint(xDiff, yDiff) {
	let jointIndex = parseInt(document.getElementById('joint-adjust-select').value, 10);
	if (!isNaN(jointIndex)) {
		let joint = currentSkeleton.joints[jointIndex];
		joint.position.x += xDiff;
		joint.position.y += yDiff;
		renderBasedOnToggleBones();
		updateJointListEntry(jointIndex);
	}
}

function moveJointUp() {
	moveJoint(0, -1);
}

function moveJointRight() {
	moveJoint(1, 0);
}

function moveJointDown() {
	moveJoint(0, 1);
}

function moveJointLeft() {
	moveJoint(-1, 0);
}

function updateJointSelectElements() {
	let defaultOptionElementHtml = '<option value=\"---\">---</option>';
	let jointIndices = Object.keys(currentSkeleton.joints)
	let selectElements = document
		.getElementsByTagName('select');
	let jointSelectElements = [];
	for (let selectElement of selectElements) {
		if (selectElement.id.startsWith('joint')) {
			jointSelectElements.push(selectElement);
		}
	}
	jointSelectElements.forEach(selectElement => {
		selectElement.innerHTML = defaultOptionElementHtml;
		jointIndices
			.map(function(jointIndex) {
				let optionElement = document.createElement('option');
				optionElement.value = jointIndex;
				optionElement.innerText = jointIndex;
				return optionElement;
			})
			.forEach(function(optionElement) {
				selectElement.appendChild(optionElement);
			});
	});
}

function addJoint(position) {
	// add to skeleton
	let jointIndex = Object.keys(currentSkeleton.joints).length + 1;
	currentSkeleton.joints[jointIndex] = {
		position: position,
		connectsTo: []
	};
	let jointsList = document.getElementById('joints-list');
	let newListItem = document.createElement('li');
	newListItem.innerText = generateJointListItemInnerText(currentSkeleton.joints[jointIndex]);
	jointsList.appendChild(newListItem);
	// add to joint <select> options
	updateJointSelectElements();
}

function generateJointListItemInnerText(joint) {
	const xPosition = joint.position.x - imageOffsetX;
	const yPosition = joint.position.y - imageOffsetY;
	return `(${xPosition}, ${yPosition}) => [${'' + joint.connectsTo}]`;
}

function updateAllJointListEntries() {
	let jointsList = document.getElementById('joints-list');
	jointsList.innerHTML = '';
	for (let key of Object.keys(currentSkeleton.joints)) {
		let listItemElement = document.createElement('li');
		listItemElement.innerText = generateJointListItemInnerText(currentSkeleton.joints[key]);
		jointsList.appendChild(listItemElement);
	}
}

function updateJointListEntry(jointListIndex) {
	let jointsList = document.getElementById('joints-list');
	let joint = currentSkeleton.joints[jointListIndex];
	jointsList.childNodes[jointListIndex - 1].innerText = generateJointListItemInnerText(joint);
}
/*
 * end joints
 */

/*
 * begin bones
 */
function drawAllBones() {
	clearCanvas();
	drawSprite();
	Object.entries(currentSkeleton.joints).forEach(entry => {
		let joint = entry[1];
		joint.connectsTo.forEach(otherJointIndex => {
			otherJoint = currentSkeleton.joints[otherJointIndex];
			drawBone(joint.position, otherJoint.position)
		});
	});
}

function drawBone(joint1Position, joint2Position) {
	context.strokeStyle = 'rgba(255, 255, 0, 1.0)';
	context.lineWidth = 1;
	context.beginPath();
	context.moveTo(joint1Position.x, joint1Position.y);
	context.lineTo(joint2Position.x, joint2Position.y);
	context.stroke();
}

function createBone() {
	// create bone i.e. join add "bone" arc to skeleton "graph" joining "joint" vertices
	let jointOption1Index = parseInt(document.getElementById('joint1-select').value, 10);
	let jointOption2Index = parseInt(document.getElementById('joint2-select').value, 10);
	if (!isNaN(jointOption1Index) && !isNaN(jointOption2Index) && jointOption1Index !== jointOption2Index) {
		let joint1 = currentSkeleton.joints[jointOption1Index];
		let joint2 = currentSkeleton.joints[jointOption2Index];
		if (!joint1.connectsTo.includes(jointOption2Index)) {
			joint1.connectsTo.push(jointOption2Index);
		}
		if (!joint2.connectsTo.includes(jointOption1Index)) {
			joint2.connectsTo.push(jointOption1Index);
		}
		/*
		 * <ol>
		 *   <li>1 ...</li>
		 *   <li>2 ...</li>
		 *   etc.
		 * </ol>
		 */
		// joint index of n maps to joint list index of n - 1
		updateJointListEntry(jointOption1Index);
		updateJointListEntry(jointOption2Index);
	}
}
/*
 * end bones
 */

/*
 * begin side effects
 */
function handleVelocityToolMouseDown(event, mousePosition) {
	const xVelocityInput = document.getElementById("velocity-side-effect-x-value");
	const xVelocity = xVelocityInput.value;
	const yVelocityInput = document.getElementById("velocity-side-effect-y-value");
	const yVelocity = yVelocityInput.value;
	if (xVelocity.length === 0 || isNaN(parseFloat(xVelocity))
		|| yVelocity.length === 0 || isNaN(parseFloat(yVelocity))) {
		return;
	}
	const sideEffectFormData = new FormData(document.getElementById("side-effect-form"));
	let selectedSideEffect;
	for (const entry of sideEffectFormData) {
		selectedSideEffect = entry[1]; // thank you JavaScript
	}
	currentSkeleton["sideEffects"] = {
		x: xVelocity,
		y: yVelocity
	};
	console.log("side effect selected:", selectedSideEffect, "value:", velocity);
}
/*
 * end side effects
 */

/*
 * begin frame navigation
 */
function setCurrentFrameText() {
	document.getElementById('current-frame').innerText = `Current frame: ${currentFrameIndex + 1}`;
}

function addNewFrame() {
	if (!currentSkeleton.sprite) {
		return;
	}
	document.getElementById('image-upload').disabled = false;
	frameData[currentFrameIndex++] = JSON.parse(JSON.stringify(currentSkeleton));
	delete currentSkeleton.sprite
	frameData[currentFrameIndex] = currentSkeleton;
	clearCanvas();
	setCurrentFrameText();
	updateJointSelectElements();
	updateHitboxSelectElements();
	updateAllJointListEntries();
	updateAllHitboxListEntries()
}

function goToPreviousFrame() {
	if (currentFrameIndex <= 0) {
		return;
	}
	if (!currentSkeleton.sprite) {
		frameData.pop();
	}
	currentSkeleton = frameData[--currentFrameIndex];
	const spriteFileName = currentSkeleton.sprite;
	if (!!spriteFileName) {
		drawImageFromFileName(spriteFileName);
	}
}

function goToNextFrame() {
	if (currentFrameIndex >= frameData.length - 1 || !currentSkeleton.sprite) {
		return;
	}
	currentSkeleton = frameData[++currentFrameIndex];
	const spriteFileName = currentSkeleton.sprite;
	if (!!spriteFileName) {
		drawImageFromFileName(spriteFileName);
	}
}
/*
 * end frame navigation
 */

/*
 * begin canvas
 */
/**
 * Draws crosshairs for each joint in skeleton.
 */
function drawAllCrossHairs() {
	clearCanvas();
	drawSprite();
	Object.entries(currentSkeleton.joints).forEach(entry => {
		drawJointCrosshairs(entry[1].position, entry[0])
	});
}

function drawJointCrosshairs(position, label) {
	context.strokeStyle = 'rgba(255, 0, 0, 1.0)';
	context.lineWidth = 1;
	context.beginPath();
	context.moveTo(position.x, position.y - 10);
	context.lineTo(position.x, position.y + 10);
	context.moveTo(position.x - 10, position.y);
	context.lineTo(position.x + 10, position.y);
	context.font = '8pt courier';
	context.strokeText(label, position.x - 10, position.y - 5);
	context.stroke();
}

function drawHitboxCrosshairs(position, label) {
	context.strokeStyle = 'rgba(50, 50, 255, 1.0)';
	context.lineWidth = 1;
	context.beginPath();
	context.moveTo(position.x - 5, position.y - 5);
	context.lineTo(position.x + 5, position.y + 5);
	context.moveTo(position.x - 5, position.y + 5);
	context.lineTo(position.x + 5, position.y - 5);
	context.font = '8pt courier';
	context.strokeText(label, position.x - 10, position.y - 5);
	context.stroke();
}

function clearCanvas() {
	if (context) {
		context.clearRect(0, 0, canvas.width, canvas.height);
	}
}

// user clicks on canvas, drawing crosshairs if an image is present
function handleOnCanvasMouseDown(event) {
	const formData = new FormData(document.getElementById("tool-form"));
	for (const entry of formData) {
		selectedTool = entry[1]; // thank you JavaScript
	}
	toolNameToMouseDownHandlerMap[selectedTool](event, getMousePosition(event));
}

function renderBasedOnToggleBones() {
	clearCanvas();
	// context.drawImage(sprite, 0, 0);
	//image.src = imageFiles[currentImageFileIndex];
	if (document.getElementById("bone-toggle").checked) {
		drawAllBones();
	} else {
		drawAllCrossHairs();
	}
	drawAllHitboxes();
}

function getMousePosition(event) {
	// magic math for determining mouse position in canvas
	const canvasBounds = canvas.getBoundingClientRect();
	return {
		x: Math.floor(event.clientX - canvasBounds.left),
		y: Math.floor(event.clientY - canvasBounds.top)
	};
}

function drawSprite() {
	context.drawImage(currentSprite, imageOffsetX, imageOffsetY);
}

function onCreateImageBitmap(sprite, imageFileName) {
	currentSkeleton.sprite = imageFileName;
	currentSprite = sprite;
	sprites.push(sprite);
	isImageLoaded = true;
	document.getElementById("bone-toggle").disabled = false;
	drawSprite();
}
/*
 * end canvas
 */

function drawImageFromUrl(imageUrl, imageFileName) {
	image = new Image();
	image.onload = function () {
		if (context) {
			createImageBitmap(image, 0, 0, image.width, image.height)
				.then(sprite => {
					onCreateImageBitmap(sprite, imageFileName)
					renderBasedOnToggleBones();
					setCurrentFrameText();
					updateJointSelectElements();
					updateHitboxSelectElements();
					updateAllJointListEntries();
					updateAllHitboxListEntries();
				});
		}
	};
	image.src = imageUrl;
}

async function drawImageFromFileName(imageFileName) {
	const imageUrl = (await fetch("/images/" + imageFileName, {cache: "no-store"})).url;
	drawImageFromUrl(imageUrl, imageFileName);
}

async function getFrameDataByNameAndLoad(event, name) {
	const frameDataToDeserialize = await (await fetch("/frame-data/" + name)).json();
	if (frameDataToDeserialize.length === 0) {
		console.error("GET /frame-data/" + name + " yielded frameDataToDeserialize with length 0!");
		return;
	}
	// clear frame data array
	frameData = [];
	// populate frame data array
	for (currentFrameIndex = 0; currentFrameIndex < frameDataToDeserialize.length; currentFrameIndex++) {
		const skeletonToDeserialize = frameDataToDeserialize[currentFrameIndex];
		for (let jointKey in skeletonToDeserialize.joints) {
			const jointToNormalize = skeletonToDeserialize.joints[jointKey];
			jointToNormalize.position.x += imageOffsetX;
			jointToNormalize.position.y += imageOffsetY;
		}
		for (let hitboxKey in skeletonToDeserialize.hitboxes) {
			const hitboxToNormalize = skeletonToDeserialize.hitboxes[hitboxKey];
			hitboxToNormalize.position.x += imageOffsetX;
			hitboxToNormalize.position.y += imageOffsetY;
		}
		frameData[currentFrameIndex] = frameDataToDeserialize[currentFrameIndex];
	}
	currentFrameIndex = 0;
	currentSkeleton = frameData[0];
	drawImageFromFileName(currentSkeleton.sprite);
}

function downloadFrameData() {
	frameData[currentFrameIndex] = currentSkeleton;
	const frameDataToSerialize = JSON.parse(JSON.stringify(frameData));
	for (let frameDataKey in frameDataToSerialize) {
		const skeletonToSerialize = frameDataToSerialize[frameDataKey];
		for (let jointKey in skeletonToSerialize.joints) {
			const jointToNormalize = skeletonToSerialize.joints[jointKey];
			jointToNormalize.position.x -= imageOffsetX;
			jointToNormalize.position.y -= imageOffsetY;
		}
		for (let hitboxKey in skeletonToSerialize.hitboxes) {
			const hitboxToNormalize = skeletonToSerialize.hitboxes[hitboxKey];
			hitboxToNormalize.position.x -= imageOffsetX;
			hitboxToNormalize.position.y -= imageOffsetY;
		}
	}
	let framesJson = new Blob([JSON.stringify(frameDataToSerialize)], { type: 'application/json' });
	let framesJsonUrl = window.URL.createObjectURL(framesJson);
	let framesDownloadAnchor = document.createElement('a');
	framesDownloadAnchor.download = 'frame_data.json';
	framesDownloadAnchor.href = framesJsonUrl;
	framesDownloadAnchor.style.display = 'none';
	document.body.appendChild(framesDownloadAnchor);
	framesDownloadAnchor.click();
	document.body.removeChild(framesDownloadAnchor);
}

function init() {
	toolNameToMouseDownHandlerMap = {
		"joint": handleJointToolMouseDown,
		"hitbox": handleHitboxToolMouseDown,
		"velocity": handleVelocityToolMouseDown
	};
	canvas = document.getElementById('canvas');
	document.getElementById('image-upload').disabled = false;
	let boneToggle = document.getElementById("bone-toggle");
	boneToggle.disabled = true;
	boneToggle.checked = false;
    if (canvas.getContext) {
		context = canvas.getContext('2d');
		canvas.width = 600;
		canvas.height = 500;
		canvas.onmousedown = handleOnCanvasMouseDown;
		// user uploads image, triggering callback, which invokes FileReader
		const fileInput = document.getElementById('image-upload');
		fileInput.value = [];
		fileInput.addEventListener('change', function(event) {
			let imageFile = event.target.files[0];
			let reader = new FileReader();
			// FileReader reads the image, triggering callback, which populates image data
			reader.onload = function(event) {
				drawImageFromUrl(event.target.result, imageFile.name);
			};
			reader.readAsDataURL(imageFile);
		});
	}
	fetch("/frame-data/")
		.then(function (rawResponse) {
			console.log('frame-data raw response:', rawResponse);
			const response = rawResponse.json()
				.then(frameDataList => {
					console.log('frame-data response:', frameDataList);
					for (const frameDataName of frameDataList) {
						const frameDataList = document.getElementById("frame-data-list");
						let listItemElement = document.createElement("li");
						// let selectedElementClassName = "selected-level";
						// if (level === selectedElement) {
						// 	listItemElement.classList.add(selectedElementClassName);
						// } else {
						// 	listItemElement.classList.remove(selectedElementClassName);
						// }
						listItemElement.className = "frame-data";
						listItemElement.innerHTML = frameDataName;
						listItemElement.onclick = function(event) {
							getFrameDataByNameAndLoad(event, frameDataName).then();
						};
						frameDataList.appendChild(listItemElement);
					}
				})
				.catch(function (err) {
					console.warn("JSON read of /frame-data response failed:", err);
				});
		})
		.catch(function (err) {
			console.warn("/frame-data GET request failed.", err);
		});
}