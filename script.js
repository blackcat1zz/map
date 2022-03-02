'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, duration, distance) {
    this.coords = coords;
    this.duration = duration;
    this.distance = distance;
    this.description = this._description();
  }

  _description() {
    //ignore prettier
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return `on ${months[this.date.getMonth()]} ${this.date.getDay()}`;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, duration, distance, elevationGain) {
    super(coords, duration, distance);
    this.elevationGain = elevationGain;
    this.calcPace();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, duration, distance, cadence) {
    super(coords, duration, distance);
    this.cadence = cadence;
    this.calcSpeed();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const run1 = new Running([23, 10], 10, 20, 30);
const cylc1 = new Cycling([25, 24], 40, 50, 60);
console.log(run1, cylc1);

class App {
  #map;
  #mapEvent;
  mapZoomLevel = 13;
  workouts = [];

  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._showForm.bind(this));
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
    containerWorkouts.addEventListener('click', this._moveTo.bind(this));
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('Could not get your position!');
      }
    );
  }

  _loadMap(position) {
    const { longitude, latitude } = position.coords;

    this.#map = L.map('map').setView([latitude, longitude], this.mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on(
      'click',
      function (mapE) {
        this.#mapEvent = mapE;
        inputDistance.focus();
        form.classList.remove('hidden');
      }.bind(this)
    );
  }

  _showForm(e) {
    e.preventDefault();
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    const checkNum = function (...El) {
      return El.every(mov => {
        return mov > 0 && Number.isFinite(mov);
      });
    };

    // Get data from form
    const type = inputType.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;

    // Check if data valid

    if (type == 'cycling') {
      const cadence = +inputCadence.value;

      if (!checkNum(duration, distance, cadence)) {
        alert('Please use positive number');
        return;
      }

      workout = new Cycling([lat, lng], duration, distance, cadence);
    }
    if (type == 'running') {
      const elevationGain = +inputElevation.value;

      if (!checkNum(duration, distance, elevationGain)) {
        alert('Please use positive number');
        return;
      }

      workout = new Running([lat, lng], duration, distance, elevationGain);
    }
    console.log(workout);

    this.workouts.push(workout);

    // If workout running , create running object
    // If workout cycling , create cycling object

    // Add new object to workouts array

    this._renderWorkout(workout);

    // Render workout on map as marker

    this._rederWorkoutMap(workout);

    // Hide form and blur inputs
    this._hideForm(inputDistance, inputDuration, inputElevation, inputCadence);
  }
  _hideForm(...input) {
    input.forEach(mov => {
      mov.value = '';
      mov.blur();
    });

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
  }

  _renderWorkout(workout) {
    console.log(workout.type);
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 300,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(workout.description)
      .openPopup();
  }

  _toggleElevationField(e) {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _moveTo(e) {
    const moveEl = e.target.closest('.workout');

    if (!moveEl) return;

    const workout = this.workouts.find(mov => mov.id == moveEl.dataset.id);

    this.#map.setView(workout.coords, this.mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _rederWorkoutMap(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${
      workout.type[0].toUpperCase() + workout.type.slice(1)
    } ${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">🚴‍♀️</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type == 'cycling') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">m</span>
    </div>
  </li> `;
    }

    if (workout.type == 'running') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;
    }

    containerWorkouts.insertAdjacentHTML('beforeend', html);
  }
}

const app = new App();
