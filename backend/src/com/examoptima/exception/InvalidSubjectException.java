package com.examoptima.exception;

/**
 * Module II & III: Inheritance & Custom Exception
 * Demonstrates multilevel inheritance: Exception -> SchedulingException -> InvalidSubjectException
 * and use of the `super` keyword to invoke the parent constructor.
 */
public class InvalidSubjectException extends SchedulingException {
    private static final long serialVersionUID = 1L;

    public InvalidSubjectException(String message) {
        super(message);
    }
}

