import NextAuth from "next-auth/next";
import Credentials from "next-auth/providers/credentials";
import connect from "../../../../utils/db";
import { verifyPassword } from "../../../../utils/auth"; // Assuming you have a password verification function

// Auth options with credentials provider
const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt", // Using JWT strategy for session
    maxAge: 15 * 60,
    updateAge: 5 * 60,
  },
  jwt: {
    maxAge: 15 * 60,
  },
  pages: {
    signIn: "/auth", // Redirect to login page if unauthenticated
  },
  callbacks: {
    // Modify the JWT token to include role
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role; // Assign user role to the token
      }
      return token;
    },
    // Add the user role to the session object
    async session({ session, token }) {
      session.user.role = token.role; // Pass the role into the session
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "text", placeholder: "Email" },
        password: {
          label: "Password",
          type: "password",
          placeholder: "********",
        },
      },
      authorize: async (credentials) => {
        const { email, password } = credentials;

        // Connect to MongoDB
        const client = await connect();

        // Find user by email
        const usersCollection = client.collection("users");
        const user = await usersCollection.findOne({ email });

        if (!user) {
          throw new Error("No user found with this email");
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password); // Assuming passwords are hashed in the DB
        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        // Return user object, including the role from the database
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role, // Extract role from the database
        };
      },
    }),
  ],
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
