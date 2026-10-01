package com.pipeline.pipelineorchestrator.model;

public class ArtifactInfo {

    private String name;
    private String packaging; // JAR, WAR, EAR
    private String version;
    private String size;
    private String checksumSha256;
    private String repository;
    private String repositoryUrl;
    private String publishedAt;

    public ArtifactInfo() {
    }

    public ArtifactInfo(String name, String packaging, String version, String size,
                        String checksumSha256, String repository, String repositoryUrl, String publishedAt) {
        this.name = name;
        this.packaging = packaging;
        this.version = version;
        this.size = size;
        this.checksumSha256 = checksumSha256;
        this.repository = repository;
        this.repositoryUrl = repositoryUrl;
        this.publishedAt = publishedAt;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPackaging() {
        return packaging;
    }

    public void setPackaging(String packaging) {
        this.packaging = packaging;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public String getChecksumSha256() {
        return checksumSha256;
    }

    public void setChecksumSha256(String checksumSha256) {
        this.checksumSha256 = checksumSha256;
    }

    public String getRepository() {
        return repository;
    }

    public void setRepository(String repository) {
        this.repository = repository;
    }

    public String getRepositoryUrl() {
        return repositoryUrl;
    }

    public void setRepositoryUrl(String repositoryUrl) {
        this.repositoryUrl = repositoryUrl;
    }

    public String getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(String publishedAt) {
        this.publishedAt = publishedAt;
    }
}
