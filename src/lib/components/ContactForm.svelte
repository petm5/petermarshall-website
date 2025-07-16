<form action="https://contact.petermarshall.ca/" method="post" enctype="multipart/form-data">
  <p>
    <label for="name">Name</label>
    <input name="name" required />
  </p>
  <p>
    <label for="email">Email</label>
    <input name="email" type="email" required />
  </p>
  <p>
    <label for="message">Message</label>
    <textarea name="message" rows=10 required></textarea>
  </p>
  <p>
    <input type="submit" value="Submit" />
  </p>
</form>

<style>
  form p {
    margin-bottom: 1rem;
  }

  input, textarea {
    border: 2px solid;
    line-height: 1.5;
    border-radius: 4px;
    padding: .5rem .5rem;
    background: transparent;
    color: inherit;
    min-width: min(30rem, 100%);
    font-size: 14px;
    font-weight: 500;
    font-family: inherit;
  }

  input[type=submit] {
    cursor: pointer;
    font-size: inherit;
    line-height: inherit;
    min-width: unset;
    padding: 0.6rem 1.2rem;
  }

  input:focus, textarea:focus {
    outline: none;
    color: var(--action-color);
  }

  label:has(+ *:focus) {
    color: var(--action-color);
  }

  p:has(label) {
    padding-top: 0.5em;
  }

  p > label {
    position: absolute;
    transform: translate(.5rem, -50%);
    padding: 0 .5rem;
    background: #121117;
    line-height: 1;
    color: inherit;
  }

  textarea {
    padding: .6rem .5rem;
  }

  form {
    padding: 1rem 0;
  }
</style>
