const { AuthenticationError } = require("apollo-server-express");
const { User, Book } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    // users: async (parent, args, context) => {
    //   if (context.user) {
    //     return User.find().populate("books");
    //   }
    //   throw new AuthenticationError("You need to be logged in!");
    // },
    // books: async (parent, { username }) => {
    //   const params = username ? { username } : {};
    //   return Book.find(params).sort({ createdAt: -1 });
    // },
    me: async (parent, args, context) => {
      if (context.user) {
       // return User.findById({ _id: context.user._id }).populate("books");
       const userData = await User.findOne({_id:context.user._id}).select("-__v -password");
       return userData;
      }
      throw new AuthenticationError("You need to be logged in!");
    },
  },

  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      console.log("login")
      const user = await User.findOne({ email });
console.log(user)
      if (!user) {
        throw new AuthenticationError("No user found with this email address");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials");
      }
console.log(correctPw)
      const token = signToken(user);

      return { token, user };
    },
    // addBook: async (
    //   parent,
    //   {
    //     _id,
    //     bookId,
    //     authors,
    //     description,
    //     image,
    //     title,
    //     infoLink,
    //     previewLink,
    //     publishedDate,
    //   },
    //   context
    // ) => {
    //   if (context.user) {
    //     return User.findOneAndUpdate(
    //       { _id },
    //       {
    //         $addToSet: {
    //           savedBooks: {
    //             bookId: bookId,
    //             authors,
    //             description,
    //             image,
    //             title,
    //             infoLink,
    //             previewLink,
    //             publishedDate,
    //           },
    //         },
    //       },
    //       { new: true }
    //     );
    //   }
    //   throw new AuthenticationError("You need to be logged in!");
    // },
    savedBook: async (parent, {bookData},context) => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate (
          {_id:context.user._id},
          {$push:{savedBooks:bookData}},
          {new:true}
        );
        return updatedUser;
      }
      throw new AuthenticationError ("You must login.")
    },
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate (
          {_id:context.user._id},
          {$pull: {savedBooks:{bookId}}},
          {new:true}
        );
      return updatedUser;
      }
      throw new AuthenticationError("You need to be logged in!");
    },
  },
};

module.exports = resolvers;
