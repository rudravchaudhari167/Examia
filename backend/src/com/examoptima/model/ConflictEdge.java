package com.examoptima.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * Module I: Encapsulated model representing an undirected conflict edge between two examination subjects.
 */
public class ConflictEdge implements Serializable {
    private static final long serialVersionUID = 1L;

    public final String uId;
    public final String vId;
    public final String uCode;
    public final String vCode;
    public final List<String> sharedDivisions;

    public ConflictEdge(String uId, String vId, String uCode, String vCode, List<String> sharedDivisions) {
        this.uId = uId;
        this.vId = vId;
        this.uCode = uCode;
        this.vCode = vCode;
        this.sharedDivisions = (sharedDivisions != null) ? new ArrayList<String>(sharedDivisions) : new ArrayList<String>();
    }
}
