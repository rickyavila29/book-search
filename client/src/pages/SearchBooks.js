import React, { useState, useEffect } from "react";
import { Jumbotron, Container, Form, Button } from "react-bootstrap";
import BookList from "../components/BookListSearch";


import { ADD_BOOK } from "../utils/mutations";
import { useMutation } from "@apollo/client";
import { saveBookIds, getSavedBookIds } from "../utils/localStorage";
import { searchGoogleBooks } from "../utils/API";
import Auth from "../utils/auth"

const SearchBooks = () => {
  // create state for holding returned google api data
  const [searchedBooks, setSearchedBooks] = useState([]);
  // create state for holding our search field data
  const [searchInput, setSearchInput] = useState("");

  // create state to hold saved bookId values
  const [savedBookIds, setSavedBookIds] = useState(getSavedBookIds());

  // set up useEffect hook to save `savedBookIds` list to localStorage on component unmount
  // learn more here: https://reactjs.org/docs/hooks-effect.html#effects-with-cleanup
  useEffect(() => {
    return saveBookIds(savedBookIds);
  }, [savedBookIds]);

  //section
  // get userId from jwt token to use in query/mutation

  // create method to search for books and set state on form submit
  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (!searchInput) {
      return false;
    }

    try {
      const response = await searchGoogleBooks(searchInput);

      if (!response.ok) {
        throw new Error("something went wrong!");
      }

      const { items } = await response.json();

      // results in "items" can return duplicate book id; function below removes duplicates
      // when duplicate entries exist reeact returns an error message in the console b/c it can't uniquely identify each item

      const bookData = items.map((book) => ({
        bookId: book.id,
        authors: book.authors || ["No author to display"],
        title: book.title,
        description: book.description || "No description available.",
        image:
          book.imageLinks?.thumbnail || '',
      }));

      setSearchedBooks(bookData);
      setSearchInput("");
    } catch (err) {
      console.error(err);
    }
  };

  const [addBook] = useMutation(ADD_BOOK);

  // create function to handle saving a book to our database
  const handleSaveBook = async (bookId) => {
    // find the book in `searchedBooks` state by the matching id
    const bookToSave = searchedBooks.find((book) => book.bookId === bookId);
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false;
    }

    try {
 const {data} = await addBook ({
  variables: {bookData:{...bookToSave}}
 })

      // if book saves to user's account, save book id to state
      setSavedBookIds([...savedBookIds, bookToSave.bookId]);
      
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Jumbotron fluid className="text-light bg-dark">
        <Container>
          <h1 className="d-flex justify-content-center text-center">Search for Books!</h1>
          <Form onSubmit={handleFormSubmit}>
            <Form.Row>
              <Form.Control
                name="searchInput"
                style={{ width: "65%" }}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                type="text"
                size="lg"
                placeholder="Search by title keywords"
              />
              <Button
                type="submit"
                variant="success"
                className="ml-1"
                style={{ width: "30%" }}
                size="lg"
              >
                Search
              </Button>
            </Form.Row>
            <p className='mt-2 ml-2 small'>* Includes only books with a preview.</p>
          </Form>
        </Container>
      </Jumbotron>

      <BookList
        searchedBooks={searchedBooks}
        savedBookIds={savedBookIds}
        handleSaveBook={handleSaveBook}
        source={"search"}
      />
    </>
  );
};

export default SearchBooks;
