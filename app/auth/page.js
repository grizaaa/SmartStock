"use client";

import { useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function submitHandler(event) {
    event.preventDefault();
    const enteredEmail = emailInputRef.current?.value;
    const enteredPassword = passwordInputRef.current?.value;

    // Reset error state
    setError(null);

    // Attempt to sign in with credentials
    const result = await signIn("credentials", {
      redirect: false, // Do not auto-redirect on success
      email: enteredEmail,
      password: enteredPassword,
    });

    if (result?.error) {
      setError(result.error); // Display error message if login fails
    } else {
      // If login is successful, redirect to the homepage or dashboard
      console.log("Login successful!");
      router.push("/"); // Redirect after successful login
    }
  }

  return (
    <section className={styles.auth}>
      <h1>Login</h1>
      {error && <p className={styles.error}>{error}</p>}{" "}
      {/* Display login errors */}
      <form onSubmit={submitHandler}>
        <div className={styles.control}>
          <label htmlFor="email">Your Email</label>
          <input type="email" id="email" ref={emailInputRef} required />
        </div>
        <div className={styles.control}>
          <label htmlFor="password">Your Password</label>
          <input
            type="password"
            id="password"
            ref={passwordInputRef}
            required
          />
        </div>
        <div className={styles.actions}>
          <button className={styles.buttonAnimate} type="submit">
            Login
          </button>
        </div>
      </form>
    </section>
  );
}
